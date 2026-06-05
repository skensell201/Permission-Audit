// src/components/__tests__/PermissionTree.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionTree } from '../PermissionTree';
import { TreeNode } from '../../models/PermissionNode';

const tree: TreeNode = {
  id: 'root',
  label: 'DefaultCollection',
  kind: 'collection',
  permissions: [],
  children: [
    {
      id: 'p:Alpha',
      label: 'Alpha',
      kind: 'project',
      permissions: [],
      children: [
        {
          id: 't:Alpha|repository',
          label: 'Repositories',
          kind: 'resourceType',
          permissions: [],
          children: [
            {
              id: 'r:repo-1',
              label: 'repo-1',
              kind: 'resource',
              children: [],
              permissions: [
                {
                  projectName: 'Alpha',
                  resourceType: 'repository',
                  resourceName: 'repo-1',
                  namespaceName: 'Git Repositories',
                  actionName: 'Force push',
                  allow: false,
                  source: 'via [Alpha]\\Devs',
                  securityUrl: 'http://deep-link',
                  token: 't',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('PermissionTree', () => {
  it('renders root and projects collapsed, expands on click down to permission rows', () => {
    render(<PermissionTree root={tree} />);
    const getNodeLabel = (label: string) => (content: string, element: Element | null) => {
      return !!(element?.className.includes('node-label') && content.includes(label));
    };
    expect(screen.getByText(getNodeLabel('Alpha'))).toBeTruthy();
    expect(screen.queryByText('Repositories')).toBeNull(); // collapsed = not in DOM
    fireEvent.click(screen.getByText(getNodeLabel('Alpha')));
    fireEvent.click(screen.getByText(getNodeLabel('Repositories')));
    fireEvent.click(screen.getByText(getNodeLabel('repo-1')));
    expect(screen.getByText('Force push')).toBeTruthy();
    expect(screen.getByText(/via \[Alpha\]\\Devs/)).toBeTruthy();
    expect(screen.getByText('✗ Deny')).toBeTruthy();
    expect((screen.getByText(/open/) as HTMLAnchorElement).href).toBe('http://deep-link/');
  });
});
