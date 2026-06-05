// src/components/__tests__/ExportButton.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';
import { PermissionEntry } from '../../models/PermissionNode';

const entries: PermissionEntry[] = [
  {
    projectName: 'P',
    resourceType: 'repository',
    resourceName: 'r',
    namespaceName: 'Git Repositories',
    actionName: 'Read',
    allow: true,
    source: 'direct',
    securityUrl: 'http://x',
    token: 't',
  },
];

describe('ExportButton', () => {
  it('invokes the download callback with filename and blob per format', () => {
    const download = jest.fn();
    render(<ExportButton entries={entries} subject="john.doe" download={download} />);
    fireEvent.click(screen.getByText(/export/i));
    fireEvent.click(screen.getByText('CSV'));
    expect(download).toHaveBeenCalledTimes(1);
    const [filename, blob] = download.mock.calls[0];
    expect(filename).toBe('permissions-john.doe.csv');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('is disabled with no entries', () => {
    render(<ExportButton entries={[]} subject="x" download={jest.fn()} />);
    expect((screen.getByText(/export/i) as HTMLButtonElement).disabled).toBe(true);
  });
});
