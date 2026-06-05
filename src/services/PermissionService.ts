import { ApiClient } from './ApiClient';

export interface NamespaceAction {
  bit: number;
  displayName: string;
}

export interface SecurityNamespace {
  namespaceId: string;
  name: string;
  actions: NamespaceAction[];
}

export interface Ace {
  token: string;
  descriptor: string;
  allow: number;
  deny: number;
}

interface RawNamespace {
  namespaceId: string;
  name: string;
  actions: Array<{ bit: number; displayName: string }>;
}

interface RawAcl {
  token: string;
  acesDictionary?: Record<string, { descriptor: string; allow: number; deny: number }>;
}

export class PermissionService {
  constructor(private api: ApiClient) {}

  async getNamespaces(): Promise<SecurityNamespace[]> {
    const res = await this.api.get<{ value: RawNamespace[] }>('/_apis/securitynamespaces?api-version=6.0');
    return res.value.map((ns) => ({
      namespaceId: ns.namespaceId,
      name: ns.name,
      actions: ns.actions.map((a) => ({ bit: a.bit, displayName: a.displayName })),
    }));
  }

  /** All ACEs in this namespace that belong to one of `descriptors`. */
  async getAcesForDescriptors(ns: SecurityNamespace, descriptors: string[]): Promise<Ace[]> {
    const res = await this.api.get<{ value: RawAcl[] }>(
      `/_apis/accesscontrollists/${ns.namespaceId}?descriptors=${descriptors
        .map(encodeURIComponent)
        .join(',')}&includeExtendedInfo=false&api-version=6.0`
    );
    const aces: Ace[] = [];
    for (const acl of res.value) {
      for (const key of Object.keys(acl.acesDictionary ?? {})) {
        const ace = acl.acesDictionary![key];
        aces.push({ token: acl.token, descriptor: ace.descriptor, allow: ace.allow, deny: ace.deny });
      }
    }
    return aces;
  }

  /** Display names of all actions whose bit is set in `bits`. */
  decodeBits(ns: SecurityNamespace, bits: number): string[] {
    return ns.actions.filter((a) => a.bit !== 0 && (bits & a.bit) === a.bit).map((a) => a.displayName);
  }
}
