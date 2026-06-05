import { ApiClient } from './ApiClient';
import { Catalogs } from './TokenResolver';
import { runBatched } from '../utils/batch';

interface ListResponse<T> {
  value: T[];
}

export class ResourceService {
  constructor(private api: ApiClient) {}

  async loadCatalogs(onProgress: (msg: string) => void): Promise<Catalogs> {
    onProgress('Loading projects...');
    const projectsRes = await this.api.get<ListResponse<{ id: string; name: string }>>(
      '/_apis/projects?$top=1000&api-version=6.0'
    );
    const projects = new Map<string, string>(projectsRes.value.map((p) => [p.id, p.name]));

    onProgress('Loading repositories...');
    const reposRes = await this.api.get<ListResponse<{ id: string; name: string; project: { id: string } }>>(
      '/_apis/git/repositories?api-version=6.0'
    );
    const repos = new Map<string, { name: string; projectId: string }>(
      reposRes.value.map((r) => [r.id, { name: r.name, projectId: r.project.id }])
    );

    const buildDefs = new Map<string, { name: string; projectId: string }>();
    const wikis = new Map<string, { name: string; projectId: string }>();
    const entries = [...projects.entries()];
    let done = 0;
    await runBatched(entries, async ([projectId, projectName]) => {
      try {
        const defs = await this.api.get<ListResponse<{ id: number; name: string }>>(
          `/${encodeURIComponent(projectName)}/_apis/build/definitions?api-version=6.0`
        );
        for (const d of defs.value) buildDefs.set(`${projectId}/${d.id}`, { name: d.name, projectId });
      } catch {
        /* project without builds or no access — skip */
      }
      try {
        const w = await this.api.get<ListResponse<{ id: string; name: string }>>(
          `/${encodeURIComponent(projectName)}/_apis/wiki/wikis?api-version=6.0`
        );
        for (const wiki of w.value) wikis.set(wiki.id, { name: wiki.name, projectId });
      } catch {
        /* wiki disabled — skip */
      }
      done++;
      onProgress(`Loading project resources ${done}/${entries.length}...`);
    });

    return { projects, repos, buildDefs, wikis };
  }
}
