// src/models/PermissionNode.ts

/** A user or group as returned by the Identities API. */
export interface Identity {
  descriptor: string;
  displayName: string;
  isGroup: boolean;
}

export type ResourceType =
  | 'collection'
  | 'project'
  | 'repository'
  | 'pipeline'
  | 'areaPath'
  | 'wiki'
  | 'other';

/** One decoded permission row — the atom everything else works with. */
export interface PermissionEntry {
  projectName: string | null; // null = collection level
  resourceType: ResourceType;
  resourceName: string;
  namespaceName: string;
  actionName: string;
  allow: boolean; // true = Allow, false = Deny
  source: string; // 'direct' or 'via <group display name>'
  securityUrl: string;
  token: string;
}

export type TreeNodeKind = 'collection' | 'project' | 'resourceType' | 'resource';

export interface TreeNode {
  id: string;
  label: string;
  kind: TreeNodeKind;
  children: TreeNode[];
  /** Populated on 'resource' (and collection-level resource) nodes only. */
  permissions: PermissionEntry[];
}
