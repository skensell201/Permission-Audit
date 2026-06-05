// src/services/__tests__/TokenResolver.test.ts
import { resolveToken, Catalogs } from '../TokenResolver';

const BASE = 'http://srv/DefaultCollection';

const catalogs: Catalogs = {
  projects: new Map([['p1', 'ProjectAlpha']]),
  repos: new Map([['r1', { name: 'repo-frontend', projectId: 'p1' }]]),
  buildDefs: new Map([['p1/42', { name: 'CI Build', projectId: 'p1' }]]),
  wikis: new Map([['w1', { name: 'Alpha Wiki', projectId: 'p1' }]]),
};

describe('resolveToken', () => {
  it('resolves a git repo token', () => {
    expect(resolveToken('Git Repositories', 'repoV2/p1/r1', catalogs, BASE)).toEqual({
      resourceName: 'repo-frontend',
      resourceType: 'repository',
      projectName: 'ProjectAlpha',
      securityUrl: `${BASE}/ProjectAlpha/_settings/repositories?repo=r1&action=security`,
    });
  });

  it('resolves a project token', () => {
    expect(resolveToken('Project', '$PROJECT:vstfs:///Classification/TeamProject/p1', catalogs, BASE)).toEqual({
      resourceName: 'ProjectAlpha',
      resourceType: 'project',
      projectName: 'ProjectAlpha',
      securityUrl: `${BASE}/ProjectAlpha/_settings/permissions`,
    });
  });

  it('resolves a build definition token', () => {
    expect(resolveToken('Build', 'p1/42', catalogs, BASE)).toEqual({
      resourceName: 'CI Build',
      resourceType: 'pipeline',
      projectName: 'ProjectAlpha',
      securityUrl: `${BASE}/ProjectAlpha/_build/definition?id=42&view=security`,
    });
  });

  it('resolves a wiki token', () => {
    expect(resolveToken('Wiki', 'wiki/p1/w1', catalogs, BASE)).toEqual({
      resourceName: 'Alpha Wiki',
      resourceType: 'wiki',
      projectName: 'ProjectAlpha',
      securityUrl: `${BASE}/ProjectAlpha/_settings/permissions`,
    });
  });

  it('falls back to other/collection for unknown tokens', () => {
    expect(resolveToken('Unknown NS', 'mystery-token', catalogs, BASE)).toEqual({
      resourceName: 'mystery-token',
      resourceType: 'other',
      projectName: null,
      securityUrl: `${BASE}/_settings/permissions`,
    });
  });

  it('maps an unknown token containing a known project id to that project', () => {
    expect(resolveToken('CSS', 'vstfs:///Classification/Node/abc;p1', catalogs, BASE)).toEqual({
      resourceName: 'vstfs:///Classification/Node/abc;p1',
      resourceType: 'areaPath',
      projectName: 'ProjectAlpha',
      securityUrl: `${BASE}/ProjectAlpha/_settings/permissions`,
    });
  });
});
