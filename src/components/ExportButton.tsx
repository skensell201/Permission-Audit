// src/components/ExportButton.tsx
import React, { useState } from 'react';
import { PermissionEntry } from '../models/PermissionNode';
import { toCsv, toJson, toXlsxBlob } from '../services/ExportService';

export interface ExportButtonProps {
  entries: PermissionEntry[];
  /** Sanitized display name of the audited identity, used in the filename. */
  subject: string;
  /** Injectable for tests; the default triggers a real browser download. */
  download?: (filename: string, blob: Blob) => void;
}

function browserDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ entries, subject, download = browserDownload }: ExportButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);

  function exportAs(format: 'csv' | 'json' | 'xlsx'): void {
    const filename = `permissions-${subject}.${format}`;
    const blob =
      format === 'csv'
        ? new Blob([toCsv(entries)], { type: 'text/csv' })
        : format === 'json'
          ? new Blob([toJson(entries)], { type: 'application/json' })
          : toXlsxBlob(entries);
    download(filename, blob);
    setOpen(false);
  }

  return (
    <div className="export">
      <button disabled={entries.length === 0} onClick={() => setOpen(!open)}>
        ⬇ Export ▾
      </button>
      {open && (
        <ul className="export-menu">
          <li onClick={() => exportAs('csv')}>CSV</li>
          <li onClick={() => exportAs('xlsx')}>Excel</li>
          <li onClick={() => exportAs('json')}>JSON</li>
        </ul>
      )}
    </div>
  );
}
