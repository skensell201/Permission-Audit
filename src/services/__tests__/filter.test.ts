// src/services/__tests__/filter.test.ts
import { applyFilters, Filters, summarize } from '../filter';
import { PermissionEntry } from '../../models/PermissionNode';

function entry(over: Partial<PermissionEntry>): PermissionEntry {
  return {
    projectName: 'Alpha',
    resourceType: 'repository',
    resourceName: 'r',
    namespaceName: 'Git Repositories',
    actionName: 'Read',
    allow: true,
    source: 'direct',
    securityUrl: 'http://x',
    token: 't',
    ...over,
  };
}

const entries = [
  entry({}),
  entry({ allow: false, actionName: 'Force push', source: 'via [Alpha]\\Devs' }),
  entry({ projectName: 'Beta', namespaceName: 'Build', actionName: 'Queue builds' }),
];

const noFilters: Filters = { namespace: null, project: null, showAllow: true, showDeny: true, text: '' };

describe('applyFilters', () => {
  it('passes everything with default filters', () => {
    expect(applyFilters(entries, noFilters)).toHaveLength(3);
  });

  it('filters by project, namespace, effect and text', () => {
    expect(applyFilters(entries, { ...noFilters, project: 'Beta' })).toHaveLength(1);
    expect(applyFilters(entries, { ...noFilters, namespace: 'Build' })).toHaveLength(1);
    expect(applyFilters(entries, { ...noFilters, showDeny: false })).toHaveLength(2);
    expect(applyFilters(entries, { ...noFilters, text: 'force' })).toHaveLength(1);
  });
});

describe('summarize', () => {
  it('counts totals, projects, direct/group, deny', () => {
    expect(summarize(entries)).toEqual({ total: 3, projects: 2, direct: 2, viaGroups: 1, deny: 1 });
  });
});
