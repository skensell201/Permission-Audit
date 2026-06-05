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
});
