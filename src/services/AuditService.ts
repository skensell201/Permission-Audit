// src/services/AuditService.ts
import { Identity, PermissionEntry } from '../models/PermissionNode';
import { IdentityService } from './IdentityService';
import { PermissionService, SecurityNamespace } from './PermissionService';
import { ResourceService } from './ResourceService';
import { resolveToken } from './TokenResolver';
import { runBatched } from '../utils/batch';

export interface AuditProgress {
  step: string;
}

export interface AuditWarning {
  area: string;
  message: string;
}

export interface AuditResult {
  entries: PermissionEntry[];
  warnings: AuditWarning[];
}

export class AuditService {
  constructor(
    private identities: IdentityService,
    private perms: PermissionService,
    private resources: ResourceService,
    private baseUrl: string
  ) {}

  async run(target: Identity, onProgress: (p: AuditProgress) => void): Promise<AuditResult> {
    onProgress({ step: 'Resolving identity and groups...' });
    const expanded = await this.identities.expandMembership(target);
    const nameByDescriptor = new Map<string, string>(expanded.map((i) => [i.descriptor, i.displayName]));
    const descriptors = expanded.map((i) => i.descriptor);

    onProgress({ step: 'Loading security namespaces...' });
    const namespaces = await this.perms.getNamespaces();

    const catalogs = await this.resources.loadCatalogs((msg) => onProgress({ step: msg }));

    // Mutated from concurrent runBatched lanes — safe: Array.push is synchronous
    // and there is no await between reading shared state and pushing.
    const entries: PermissionEntry[] = [];
    const warnings: AuditWarning[] = [];
    let done = 0;
    await runBatched(namespaces, async (ns: SecurityNamespace) => {
      try {
        const aces = await this.perms.getAcesForDescriptors(ns, descriptors);
        for (const ace of aces) {
          const resolved = resolveToken(ns.name, ace.token, catalogs, this.baseUrl);
          const source =
            ace.descriptor === target.descriptor
              ? 'direct'
              : `via ${nameByDescriptor.get(ace.descriptor) ?? ace.descriptor}`;
          for (const actionName of this.perms.decodeBits(ns, ace.allow)) {
            entries.push({ ...resolved, namespaceName: ns.name, actionName, allow: true, source, token: ace.token });
          }
          for (const actionName of this.perms.decodeBits(ns, ace.deny)) {
            entries.push({ ...resolved, namespaceName: ns.name, actionName, allow: false, source, token: ace.token });
          }
        }
      } catch (e) {
        warnings.push({ area: ns.name, message: e instanceof Error ? e.message : String(e) });
      }
      done++;
      onProgress({ step: `Loading ACLs ${done}/${namespaces.length}...` });
    });

    return { entries, warnings };
  }
}
