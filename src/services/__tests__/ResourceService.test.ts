import { ResourceService } from '../ResourceService';
import { ApiClient } from '../ApiClient';

function fakeApi(routes: Array<[string, unknown]>): ApiClient {
  return {
    get: <T>(path: string): Promise<T> => {
      const hit = routes.find(([frag]) => path.includes(frag));
      if (!hit) return Promise.reject(new Error(`no fixture for ${path}`));
      return Promise.resolve(hit[1] as T);
    },
  };
}

describe('ResourceService.loadCatalogs', () => {
  it('builds all four catalogs', async () => {
    const api = fakeApi([
      ['/_apis/projects', { value: [{ id: 'p1', name: 'ProjectAlpha' }] }],
      ['/_apis/git/repositories', { value: [{ id: 'r1', name: 'repo-frontend', project: { id: 'p1' } }] }],
      ['/ProjectAlpha/_apis/build/definitions', { value: [{ id: 42, name: 'CI Build' }] }],
      ['/ProjectAlpha/_apis/wiki/wikis', { value: [{ id: 'w1', name: 'Alpha Wiki' }] }],
    ]);
    const svc = new ResourceService(api);
    const c = await svc.loadCatalogs(() => undefined);
    expect(c.projects.get('p1')).toBe('ProjectAlpha');
    expect(c.repos.get('r1')).toEqual({ name: 'repo-frontend', projectId: 'p1' });
    expect(c.buildDefs.get('p1/42')).toEqual({ name: 'CI Build', projectId: 'p1' });
    expect(c.wikis.get('w1')).toEqual({ name: 'Alpha Wiki', projectId: 'p1' });
  });

  it('tolerates a failing per-project endpoint (wiki disabled)', async () => {
    const api = fakeApi([
      ['/_apis/projects', { value: [{ id: 'p1', name: 'ProjectAlpha' }] }],
      ['/_apis/git/repositories', { value: [] }],
      ['/ProjectAlpha/_apis/build/definitions', { value: [] }],
      // no wiki route -> rejects
    ]);
    const svc = new ResourceService(api);
    const c = await svc.loadCatalogs(() => undefined);
    expect(c.wikis.size).toBe(0);
  });

  it('still loads wikis when build definitions fail for the same project', async () => {
    const api = fakeApi([
      ['/_apis/projects', { value: [{ id: 'p1', name: 'ProjectAlpha' }] }],
      ['/_apis/git/repositories', { value: [] }],
      // no build route -> rejects
      ['/ProjectAlpha/_apis/wiki/wikis', { value: [{ id: 'w1', name: 'Alpha Wiki' }] }],
    ]);
    const svc = new ResourceService(api);
    const c = await svc.loadCatalogs(() => undefined);
    expect(c.buildDefs.size).toBe(0);
    expect(c.wikis.get('w1')).toEqual({ name: 'Alpha Wiki', projectId: 'p1' });
  });
});
