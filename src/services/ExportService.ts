// src/services/ExportService.ts
import * as XLSX from 'xlsx';
import { PermissionEntry } from '../models/PermissionNode';

const HEADER = ['Project', 'Resource Type', 'Resource', 'Namespace', 'Permission', 'Effect', 'Source', 'Link'];

/** Excel treats cells starting with = + - @ as formulas even in CSV; prefix with ' to force text. */
function deFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function toRow(e: PermissionEntry): string[] {
  return [
    e.projectName ?? '(collection)',
    e.resourceType,
    e.resourceName,
    e.namespaceName,
    e.actionName,
    e.allow ? 'Allow' : 'Deny',
    e.source,
    e.securityUrl,
  ].map(deFormula);
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(entries: PermissionEntry[]): string {
  const lines = [HEADER.join(','), ...entries.map((e) => toRow(e).map(csvCell).join(','))];
  return lines.join('\n') + '\n';
}

export function toJson(entries: PermissionEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function toXlsxBlob(entries: PermissionEntry[]): Blob {
  const data = entries.map((e) =>
    HEADER.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = toRow(e)[i];
      return acc;
    }, {})
  );
  const ws = XLSX.utils.json_to_sheet(data, { header: HEADER });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Permissions');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
