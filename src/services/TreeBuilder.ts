import { PermissionEntry, ResourceType, TreeNode } from '../models/PermissionNode';

const TYPE_LABELS: Record<ResourceType, string> = {
  collection: 'Collection',
  project: 'Project',
  repository: 'Repositories',
  pipeline: 'Pipelines',
  areaPath: 'Area paths',
  wiki: 'Wikis',
  other: 'Other',
};

/**
 * Groups flat permission entries into Collection → Project → Resource type → Resource.
 */
export function buildTree(collectionName: string, entries: PermissionEntry[]): TreeNode {
  const root: TreeNode = { id: 'root', label: collectionName, kind: 'collection', children: [], permissions: [] };
  const projectNodes = new Map<string, TreeNode>();
  const typeNodes = new Map<string, TreeNode>();
  const resourceNodes = new Map<string, TreeNode>();

  for (const e of entries) {
    if (e.projectName === null) {
      root.permissions.push(e);
      continue;
    }
    let project = projectNodes.get(e.projectName);
    if (!project) {
      project = { id: `p:${e.projectName}`, label: e.projectName, kind: 'project', children: [], permissions: [] };
      projectNodes.set(e.projectName, project);
    }
    const typeKey = `${e.projectName}\0${e.resourceType}`;
    let typeNode = typeNodes.get(typeKey);
    if (!typeNode) {
      typeNode = { id: `t:${typeKey}`, label: TYPE_LABELS[e.resourceType], kind: 'resourceType', children: [], permissions: [] };
      typeNodes.set(typeKey, typeNode);
      project.children.push(typeNode);
    }
    const resKey = `${typeKey}\0${e.resourceName}`;
    let resNode = resourceNodes.get(resKey);
    if (!resNode) {
      resNode = { id: `r:${resKey}`, label: e.resourceName, kind: 'resource', children: [], permissions: [] };
      resourceNodes.set(resKey, resNode);
      typeNode.children.push(resNode);
    }
    resNode.permissions.push(e);
  }

  root.children = [...projectNodes.values()].sort((a, b) => a.label.localeCompare(b.label));
  for (const p of root.children) {
    p.children.sort((a, b) => a.label.localeCompare(b.label));
    for (const t of p.children) t.children.sort((a, b) => a.label.localeCompare(b.label));
  }
  return root;
}
