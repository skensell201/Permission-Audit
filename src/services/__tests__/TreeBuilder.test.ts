import { buildTree } from '../TreeBuilder';
import { PermissionEntry } from '../../models/PermissionNode';

function entry(over: Partial<PermissionEntry>): PermissionEntry {
  return {
    projectName: 'ProjectAlpha',
    resourceType: 'repository',
    resourceName: 'repo-frontend',
    namespaceName: 'Git Repositories',
    actionName: 'Read',
    allow: true,
    source: 'direct',
    securityUrl: 'http://x',
    token: 't',
    ...over,
  };
}

describe('buildTree', () => {
  it('groups by project, resource type, resource', () => {
    const root = buildTree('DefaultCollection', [
      entry({ actionName: 'Read' }),
      entry({ actionName: 'Contribute' }),
      entry({ resourceType: 'pipeline', resourceName: 'CI Build', namespaceName: 'Build' }),
      entry({ projectName: 'ProjectBeta', resourceName: 'repo-x' }),
    ]);
    expect(root.kind).toBe('collection');
    expect(root.children.map((p) => p.label)).toEqual(['ProjectAlpha', 'ProjectBeta']);
    const alpha = root.children[0];
    expect(alpha.children.map((t) => t.label)).toEqual(['Pipelines', 'Repositories']);
    const repos = alpha.children[1];
    expect(repos.children[0].label).toBe('repo-frontend');
    expect(repos.children[0].permissions).toHaveLength(2);
  });

  it('puts collection-level entries directly under the root', () => {
    const root = buildTree('DefaultCollection', [
      entry({ projectName: null, resourceType: 'collection', resourceName: 'DefaultCollection' }),
    ]);
    expect(root.permissions).toHaveLength(1);
    expect(root.children).toHaveLength(0);
  });

  it('sorts resources alphabetically within a resource type', () => {
    const root = buildTree('DefaultCollection', [
      entry({ resourceName: 'zeta-repo' }),
      entry({ resourceName: 'alpha-repo' }),
    ]);
    const repos = root.children[0].children[0];
    expect(repos.children.map((r) => r.label)).toEqual(['alpha-repo', 'zeta-repo']);
  });
});
