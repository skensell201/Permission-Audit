import { toCsv, toJson, toXlsxBlob } from '../ExportService';
import { PermissionEntry } from '../../models/PermissionNode';
import * as XLSX from 'xlsx';

if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(this);
    });
  };
}

const entries: PermissionEntry[] = [
  {
    projectName: 'ProjectAlpha',
    resourceType: 'repository',
    resourceName: 'repo "main"',
    namespaceName: 'Git Repositories',
    actionName: 'Read',
    allow: true,
    source: 'via [Alpha]\\Contributors',
    securityUrl: 'http://x',
    token: 't1',
  },
];

describe('toCsv', () => {
  it('writes a header and escapes quotes', () => {
    const csv = toCsv(entries);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('Project,Resource Type,Resource,Namespace,Permission,Effect,Source,Link');
    expect(lines[1]).toBe(
      'ProjectAlpha,repository,"repo ""main""",Git Repositories,Read,Allow,via [Alpha]\\Contributors,http://x'
    );
  });
});

describe('toJson', () => {
  it('round-trips entries', () => {
    expect(JSON.parse(toJson(entries))).toEqual(entries);
  });
});

describe('toXlsxBlob', () => {
  it('produces a workbook with one row per entry', async () => {
    const blob = toXlsxBlob(entries);
    const wb = XLSX.read(await blob.arrayBuffer(), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    expect(rows).toHaveLength(1);
    expect((rows[0] as Record<string, unknown>).Permission).toBe('Read');
  });
});
