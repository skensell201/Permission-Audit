// src/services/TokenResolver.ts
import { ResourceType } from '../models/PermissionNode';

export interface Catalogs {
  /** projectId -> project name */
  projects: Map<string, string>;
  /** repoId -> repo */
  repos: Map<string, { name: string; projectId: string }>;
  /** `${projectId}/${definitionId}` -> build definition */
  buildDefs: Map<string, { name: string; projectId: string }>;
  /** wikiId -> wiki */
  wikis: Map<string, { name: string; projectId: string }>;
}

export interface ResolvedToken {
  resourceName: string;
  resourceType: ResourceType;
  projectName: string | null;
  securityUrl: string;
}

export function resolveToken(nsName: string, token: string, c: Catalogs, baseUrl: string): ResolvedToken {
  if (nsName === 'Git Repositories') {
    if (token === 'repoV2') {
      return {
        resourceName: 'All repositories',
        resourceType: 'repository',
        projectName: null,
        securityUrl: `${baseUrl}/_settings/repositories`,
      };
    }
    const m = token.match(/^repoV2\/([^/]+)(?:\/([^/]+))?/);
    if (m) {
      const projectName = c.projects.get(m[1]) ?? m[1];
      if (m[2] && c.repos.has(m[2])) {
        return {
          resourceName: c.repos.get(m[2])!.name,
          resourceType: 'repository',
          projectName,
          securityUrl: `${baseUrl}/${encodeURIComponent(projectName)}/_settings/repositories?repo=${m[2]}&action=security`,
        };
      }
      return {
        resourceName: `All repositories in ${projectName}`,
        resourceType: 'repository',
        projectName,
        securityUrl: `${baseUrl}/${encodeURIComponent(projectName)}/_settings/repositories`,
      };
    }
  }

  if (nsName === 'Project') {
    const m = token.match(/TeamProject\/(.+)$/);
    if (m && c.projects.has(m[1])) {
      const projectName = c.projects.get(m[1])!;
      return {
        resourceName: projectName,
        resourceType: 'project',
        projectName,
        securityUrl: `${baseUrl}/${encodeURIComponent(projectName)}/_settings/permissions`,
      };
    }
  }

  if (nsName === 'Build' || nsName === 'ReleaseManagement') {
    const m = token.match(/^([^/]+)(?:\/(\d+))?$/);
    if (m && c.projects.has(m[1])) {
      const projectName = c.projects.get(m[1])!;
      const def = m[2] ? c.buildDefs.get(`${m[1]}/${m[2]}`) : undefined;
      if (def) {
        return {
          resourceName: def.name,
          resourceType: 'pipeline',
          projectName,
          securityUrl: `${baseUrl}/${encodeURIComponent(projectName)}/_build/definition?id=${m[2]}&view=security`,
        };
      }
      return {
        resourceName: `All pipelines in ${projectName}`,
        resourceType: 'pipeline',
        projectName,
        securityUrl: `${baseUrl}/${encodeURIComponent(projectName)}/_settings/permissions`,
      };
    }
  }

  if (nsName === 'Wiki') {
    const m = token.match(/^wiki\/([^/]+)\/([^/]+)$/);
    if (m && c.wikis.has(m[2])) {
      const projectName = c.projects.get(m[1]) ?? m[1];
      return {
        resourceName: c.wikis.get(m[2])!.name,
        resourceType: 'wiki',
        projectName,
        securityUrl: `${baseUrl}/${encodeURIComponent(projectName)}/_settings/permissions`,
      };
    }
  }

  // Fallback: try to find a known project id inside the token.
  for (const [projectId, projectName] of c.projects) {
    if (token.includes(projectId)) {
      return {
        resourceName: token,
        resourceType: nsName === 'CSS' || nsName === 'Iteration' ? 'areaPath' : 'other',
        projectName,
        securityUrl: `${baseUrl}/${encodeURIComponent(projectName)}/_settings/permissions`,
      };
    }
  }

  return {
    resourceName: token,
    resourceType: 'other',
    projectName: null,
    securityUrl: `${baseUrl}/_settings/permissions`,
  };
}
