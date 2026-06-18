import { IdentityService } from '../IdentityService';
import { ApiClient } from '../ApiClient';
import { Identity } from '../../models/PermissionNode';

/** ApiClient stub: maps URL substrings to canned responses. */
function fakeApi(routes: Array<[string, unknown]>): ApiClient {
  return {
    get: <T>(path: string): Promise<T> => {
      const hit = routes.find(([frag]) => path.includes(frag));
      if (!hit) return Promise.reject(new Error(`no fixture for ${path}`));
      return Promise.resolve(hit[1] as T);
    },
  };
}

describe('IdentityService.search', () => {
  it('maps raw identities to Identity with group flag', async () => {
    const api = fakeApi([
      [
        'searchFilter=General&filterValue=john',
        {
          value: [
            { descriptor: 'u1', providerDisplayName: 'John Doe', isContainer: false },
            { descriptor: 'g1', providerDisplayName: '[Proj]\\John Team', isContainer: true },
          ],
        },
      ],
    ]);
    const svc = new IdentityService(api);
    const found = await svc.search('john');
    expect(found).toEqual([
      { descriptor: 'u1', displayName: 'John Doe', isGroup: false },
      { descriptor: 'g1', displayName: '[Proj]\\John Team', isGroup: true },
    ]);
  });

  it('falls back to customDisplayName, then descriptor, when providerDisplayName is missing', async () => {
    const api = fakeApi([
      [
        'filterValue=x',
        {
          value: [
            { descriptor: 'g2', customDisplayName: 'Custom Group', isContainer: true },
            { descriptor: 'g3', isContainer: true },
          ],
        },
      ],
    ]);
    const svc = new IdentityService(api);
    const found = await svc.search('x');
    expect(found.map((i) => i.displayName)).toEqual(['Custom Group', 'g3']);
  });
});

describe('IdentityService.expandMembership', () => {
  it('returns self plus transitive groups, cycle-safe', async () => {
    // u1 ∈ gA; gA ∈ gB; gB ∈ gA (cycle)
    const api = fakeApi([
      ['descriptors=u1&queryMembership=Direct', { value: [{ descriptor: 'u1', providerDisplayName: 'John', isContainer: false, memberOf: ['gA'] }] }],
      ['descriptors=gA&queryMembership=Direct', { value: [{ descriptor: 'gA', providerDisplayName: 'Group A', isContainer: true, memberOf: ['gB'] }] }],
      ['descriptors=gB&queryMembership=Direct', { value: [{ descriptor: 'gB', providerDisplayName: 'Group B', isContainer: true, memberOf: ['gA'] }] }],
      ['descriptors=gA&api-version', { value: [{ descriptor: 'gA', providerDisplayName: 'Group A', isContainer: true }] }],
      ['descriptors=gB&api-version', { value: [{ descriptor: 'gB', providerDisplayName: 'Group B', isContainer: true }] }],
    ]);
    const svc = new IdentityService(api);
    const all = await svc.expandMembership({ descriptor: 'u1', displayName: 'John', isGroup: false });
    expect(all.map((i: Identity) => i.descriptor).sort()).toEqual(['gA', 'gB', 'u1']);
  });

  it('chunks descriptor queries so a user in many groups never overflows the URL (404/414)', async () => {
    const groups = Array.from({ length: 25 }, (_, i) => `g${i}`);
    const calls: string[] = [];
    const descriptorsOf = (path: string): string[] =>
      (path.match(/descriptors=([^&]+)/)?.[1] ?? '').split(',').filter(Boolean);
    const api: ApiClient = {
      get: <T>(path: string): Promise<T> => {
        calls.push(path);
        const direct = path.includes('queryMembership=Direct');
        return Promise.resolve({
          value: descriptorsOf(path).map((d) => ({
            descriptor: d,
            providerDisplayName: d,
            isContainer: d !== 'u1',
            memberOf: direct && d === 'u1' ? groups : [],
          })),
        } as T);
      },
    };
    const svc = new IdentityService(api);
    const all = await svc.expandMembership({ descriptor: 'u1', displayName: 'u1', isGroup: false });

    expect(all.map((i: Identity) => i.descriptor).sort()).toEqual(['u1', ...groups].sort());
    // No single request may carry more than 20 descriptors, or the server returns 404/414.
    for (const path of calls) {
      expect(descriptorsOf(path).length).toBeLessThanOrEqual(20);
    }
  });
});
