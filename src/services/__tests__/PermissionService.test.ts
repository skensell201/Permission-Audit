import { PermissionService, SecurityNamespace } from '../PermissionService';
import { ApiClient } from '../ApiClient';

const GIT_NS: SecurityNamespace = {
  namespaceId: 'ns-git',
  name: 'Git Repositories',
  actions: [
    { bit: 1, displayName: 'Administer' },
    { bit: 2, displayName: 'Read' },
    { bit: 4, displayName: 'Contribute' },
    { bit: 8, displayName: 'Force push' },
  ],
};

function fakeApi(response: unknown): ApiClient {
  return { get: <T>(_: string) => Promise.resolve(response as T) };
}

describe('PermissionService.getNamespaces', () => {
  it('maps raw namespaces to typed namespaces', async () => {
    const api = fakeApi({
      value: [
        {
          namespaceId: 'ns-git',
          name: 'Git Repositories',
          actions: [{ bit: 2, displayName: 'Read', name: 'GenericRead' }],
        },
      ],
    });
    const svc = new PermissionService(api);
    expect(await svc.getNamespaces()).toEqual([
      { namespaceId: 'ns-git', name: 'Git Repositories', actions: [{ bit: 2, displayName: 'Read' }] },
    ]);
  });
});

describe('PermissionService.getAcesForDescriptors', () => {
  it('chunks large descriptor sets into multiple requests', async () => {
    const calls: string[] = [];
    const api: ApiClient = {
      get: <T>(path: string): Promise<T> => {
        calls.push(path);
        return Promise.resolve({ value: [] } as T);
      },
    };
    const svc = new PermissionService(api);
    const descriptors = Array.from({ length: 45 }, (_, i) => `d${i}`);
    await svc.getAcesForDescriptors(GIT_NS, descriptors);
    expect(calls).toHaveLength(3); // 20 + 20 + 5
    expect(calls[0]).toContain('d0');
    expect(calls[2]).toContain('d44');
  });

  it('flattens acesDictionary into Ace rows', async () => {
    const api = fakeApi({
      value: [
        {
          token: 'repoV2/p1/r1',
          acesDictionary: {
            u1: { descriptor: 'u1', allow: 6, deny: 0 },
            gA: { descriptor: 'gA', allow: 2, deny: 8 },
          },
        },
      ],
    });
    const svc = new PermissionService(api);
    const aces = await svc.getAcesForDescriptors(GIT_NS, ['u1', 'gA']);
    expect(aces).toEqual([
      { token: 'repoV2/p1/r1', descriptor: 'u1', allow: 6, deny: 0 },
      { token: 'repoV2/p1/r1', descriptor: 'gA', allow: 2, deny: 8 },
    ]);
  });
});

describe('PermissionService.decodeBits', () => {
  it('returns display names for set bits', () => {
    const svc = new PermissionService(fakeApi({}));
    expect(svc.decodeBits(GIT_NS, 6)).toEqual(['Read', 'Contribute']);
  });

  it('returns empty array for zero mask', () => {
    const svc = new PermissionService(fakeApi({}));
    expect(svc.decodeBits(GIT_NS, 0)).toEqual([]);
  });
});
