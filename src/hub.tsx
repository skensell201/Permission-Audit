// src/hub.tsx
import 'azure-devops-ui/Core/override.css';
import './hub.css';
import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, ILocationService } from 'azure-devops-extension-api';
import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Identity, PermissionEntry } from './models/PermissionNode';
import { RestApiClient, ApiError } from './services/ApiClient';
import { IdentityService } from './services/IdentityService';
import { PermissionService } from './services/PermissionService';
import { ResourceService } from './services/ResourceService';
import { AuditService, AuditWarning } from './services/AuditService';
import { buildTree } from './services/TreeBuilder';
import { applyFilters, Filters, summarize } from './services/filter';
import { SearchBar } from './components/SearchBar';
import { ProgressBar } from './components/ProgressBar';
import { PermissionTree } from './components/PermissionTree';
import { ExportButton } from './components/ExportButton';

interface Services {
  identities: IdentityService;
  audit: AuditService;
  collectionName: string;
}

const DEFAULT_FILTERS: Filters = { namespace: null, project: null, showAllow: true, showDeny: true, text: '' };

function App({ services }: { services: Services }): JSX.Element {
  const [target, setTarget] = useState<Identity | null>(null);
  const [entries, setEntries] = useState<PermissionEntry[] | null>(null);
  const [warnings, setWarnings] = useState<AuditWarning[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  async function runAudit(): Promise<void> {
    if (!target) return;
    setError(null);
    setEntries(null);
    setWarnings([]);
    try {
      const result = await services.audit.run(target, (p) => setProgress(p.step));
      setEntries(result.entries);
      setWarnings(result.warnings);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setError('You need Project Collection Administrator permissions to use this tool.');
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setProgress(null);
    }
  }

  const filtered = useMemo(() => (entries ? applyFilters(entries, filters) : []), [entries, filters]);
  const hasResults = entries !== null;
  const tree = useMemo(
    () => (hasResults ? buildTree(services.collectionName, filtered) : null),
    [hasResults, filtered, services.collectionName]
  );
  const summary = useMemo(() => (hasResults ? summarize(filtered) : null), [hasResults, filtered]);
  const searchIdentities = useCallback((q: string) => services.identities.search(q), [services.identities]);
  const namespaces = useMemo(() => [...new Set((entries ?? []).map((e) => e.namespaceName))].sort(), [entries]);
  const projects = useMemo(
    () => [...new Set((entries ?? []).map((e) => e.projectName).filter((p): p is string => p !== null))].sort(),
    [entries]
  );

  return (
    <div>
      <h2>Permission Audit</h2>
      <div className="toolbar">
        <SearchBar search={searchIdentities} onSelect={setTarget} />
        <button disabled={!target || progress !== null} onClick={runAudit}>
          Find permissions
        </button>
        <ExportButton entries={filtered} subject={(target?.displayName ?? 'export').replace(/[^\w.-]+/g, '_')} />
      </div>

      <ProgressBar step={progress} />
      {error && <div className="error-box">{error}</div>}

      {warnings.length > 0 && (
        <div className="warnings">
          {warnings.map((w, i) => (
            <div key={`${w.area}-${i}`}>&#9888; {w.area}: {w.message}</div>
          ))}
        </div>
      )}

      {entries && summary && (
        <>
          <div className="summary">
            <span>Found: <b>{summary.total} permissions</b></span>
            <span>Projects: <b>{summary.projects}</b></span>
            <span>Direct: <b>{summary.direct}</b></span>
            <span>Via groups: <b>{summary.viaGroups}</b></span>
            <span className="deny-count">Deny: {summary.deny}</span>
          </div>
          <div className="filters">
            <select value={filters.namespace ?? ''} onChange={(e) => setFilters({ ...filters, namespace: e.target.value || null })}>
              <option value="">All areas</option>
              {namespaces.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <select value={filters.project ?? ''} onChange={(e) => setFilters({ ...filters, project: e.target.value || null })}>
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <label>
              <input type="checkbox" checked={filters.showAllow} onChange={(e) => setFilters({ ...filters, showAllow: e.target.checked })} /> Allow
            </label>
            <label>
              <input type="checkbox" checked={filters.showDeny} onChange={(e) => setFilters({ ...filters, showDeny: e.target.checked })} /> Deny
            </label>
            <input placeholder="Filter by permission name..." value={filters.text} onChange={(e) => setFilters({ ...filters, text: e.target.value })} />
          </div>
          {tree && <PermissionTree root={tree} />}
        </>
      )}
    </div>
  );
}

async function start(): Promise<void> {
  await SDK.init();
  await SDK.ready();
  const loc = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
  const baseUrl = (await loc.getServiceLocation()).replace(/\/$/, '');
  const token = await SDK.getAccessToken();
  const api = new RestApiClient(baseUrl, token);
  const identities = new IdentityService(api);
  const perms = new PermissionService(api);
  const resources = new ResourceService(api);
  const audit = new AuditService(identities, perms, resources, baseUrl);
  const collectionName = baseUrl.split('/').pop() ?? 'Collection';
  ReactDOM.render(<App services={{ identities, audit, collectionName }} />, document.getElementById('root'));
}

start().catch((e) => {
  const root = document.getElementById('root');
  if (root) {
    root.textContent = `Failed to initialize Permission Audit: ${e instanceof Error ? e.message : String(e)}`;
    root.className = 'error-box';
  }
});
