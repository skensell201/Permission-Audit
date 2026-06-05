// src/services/filter.ts
import { PermissionEntry } from '../models/PermissionNode';

export interface Filters {
  namespace: string | null;
  project: string | null;
  showAllow: boolean;
  showDeny: boolean;
  text: string;
}

export function applyFilters(entries: PermissionEntry[], f: Filters): PermissionEntry[] {
  const text = f.text.trim().toLowerCase();
  return entries.filter((e) => {
    if (f.namespace && e.namespaceName !== f.namespace) return false;
    if (f.project && e.projectName !== f.project) return false;
    if (!f.showAllow && e.allow) return false;
    if (!f.showDeny && !e.allow) return false;
    if (text && !e.actionName.toLowerCase().includes(text)) return false;
    return true;
  });
}

export interface Summary {
  total: number;
  projects: number;
  direct: number;
  viaGroups: number;
  deny: number;
}

export function summarize(entries: PermissionEntry[]): Summary {
  return {
    total: entries.length,
    projects: new Set(entries.map((e) => e.projectName).filter(Boolean)).size,
    direct: entries.filter((e) => e.source === 'direct').length,
    viaGroups: entries.filter((e) => e.source !== 'direct').length,
    deny: entries.filter((e) => !e.allow).length,
  };
}
