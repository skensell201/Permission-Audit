// src/services/__tests__/AuditService.test.ts
import { AuditService } from '../AuditService';
import { IdentityService } from '../IdentityService';
import { PermissionService, SecurityNamespace } from '../PermissionService';
import { ResourceService } from '../ResourceService';
import { Identity } from '../../models/PermissionNode';
import { Catalogs } from '../TokenResolver';

const BASE = 'http://srv/DefaultCollection';
const user: Identity = { descriptor: 'u1', displayName: 'John', isGroup: false };
const groupA: Identity = { descriptor: 'gA', displayName: '[Alpha]\\Contributors', isGroup: true };

const GIT_NS: SecurityNamespace = {
  namespaceId: 'ns-git',
  name: 'Git Repositories',
  actions: [
    { bit: 2, displayName: 'Read' },
    { bit: 4, displayName: 'Contribute' },
    { bit: 8, displayName: 'Force push' },
  ],
};
const BROKEN_NS: SecurityNamespace = { namespaceId: 'ns-broken', name: 'Wiki', actions: [] };

const catalogs: Catalogs = {
  projects: new Map([['p1', 'ProjectAlpha']]),
  repos: new Map([['r1', { name: 'repo-frontend', projectId: 'p1' }]]),
  buildDefs: new Map(),
  wikis: new Map(),
};

function makeService(): AuditService {
  const identities = {
    expandMembership: jest.fn().mockResolvedValue([user, groupA]),
  } as unknown as IdentityService;
  const perms = {
    getNamespaces: jest.fn().mockResolvedValue([GIT_NS, BROKEN_NS]),
    getAcesForDescriptors: jest.fn().mockImplementation((ns: SecurityNamespace) => {
      if (ns.namespaceId === 'ns-broken') return Promise.reject(new Error('boom'));
      return Promise.resolve([
        { token: 'repoV2/p1/r1', descriptor: 'u1', allow: 2, deny: 0 },
        { token: 'repoV2/p1/r1', descriptor: 'gA', allow: 4, deny: 8 },
      ]);
    }),
    decodeBits: new PermissionService(null as never).decodeBits,
  } as unknown as PermissionService;
  const resources = {
    loadCatalogs: jest.fn().mockResolvedValue(catalogs),
  } as unknown as ResourceService;
  return new AuditService(identities, perms, resources, BASE);
}

describe('AuditService.run', () => {
  it('produces decoded entries with source attribution', async () => {
    const result = await makeService().run(user, () => undefined);
    const rows = result.entries.map((e) => `${e.actionName}|${e.allow}|${e.source}`).sort();
    expect(rows).toEqual([
      'Contribute|true|via [Alpha]\\Contributors',
      'Force push|false|via [Alpha]\\Contributors',
      'Read|true|direct',
    ]);
    expect(result.entries[0].resourceName).toBe('repo-frontend');
    expect(result.entries[0].securityUrl).toContain('action=security');
  });

  it('converts a namespace failure into a warning, not a crash', async () => {
    const result = await makeService().run(user, () => undefined);
    expect(result.warnings).toEqual([{ area: 'Wiki', message: 'boom' }]);
  });

  it('reports progress for ACL loading', async () => {
    const seen: string[] = [];
    await makeService().run(user, (p) => seen.push(p.step));
    expect(seen.some((s) => s.startsWith('Loading ACLs'))).toBe(true);
  });
});
