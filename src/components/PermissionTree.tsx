// src/components/PermissionTree.tsx
import React, { useState } from 'react';
import { PermissionEntry, TreeNode } from '../models/PermissionNode';

function PermissionRow({ entry }: { entry: PermissionEntry }): JSX.Element {
  return (
    <div className="perm-row">
      <span className={entry.allow ? 'effect allow' : 'effect deny'}>
        {entry.allow ? '✓ Allow' : '✗ Deny'}
      </span>
      <span className="action">{entry.actionName}</span>
      <span className="source">· {entry.source}</span>
      <a href={entry.securityUrl} target="_blank" rel="noreferrer">
        → open
      </a>
    </div>
  );
}

function Node({ node, depth }: { node: TreeNode; depth: number }): JSX.Element {
  // Root starts expanded; everything else collapsed (lazy: children not in DOM until expanded).
  const [expanded, setExpanded] = useState(node.kind === 'collection');
  const hasContent = node.children.length > 0 || node.permissions.length > 0;
  return (
    <div className={`tree-node kind-${node.kind}`} style={{ paddingLeft: depth * 16 }}>
      <div className="node-label" onClick={() => setExpanded(!expanded)}>
        {hasContent ? (expanded ? '▼ ' : '▶ ') : ''}
        {node.label}
      </div>
      {expanded && (
        <>
          {node.permissions.map((p, i) => (
            <PermissionRow key={`${p.token}-${p.actionName}-${i}`} entry={p} />
          ))}
          {node.children.map((child) => (
            <Node key={child.id} node={child} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  );
}

export function PermissionTree({ root }: { root: TreeNode }): JSX.Element {
  return (
    <div className="permission-tree">
      <Node node={root} depth={0} />
    </div>
  );
}
