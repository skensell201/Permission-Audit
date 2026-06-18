import { ApiClient } from './ApiClient';
import { Identity } from '../models/PermissionNode';

interface RawIdentity {
  descriptor: string;
  providerDisplayName?: string;
  customDisplayName?: string;
  isContainer: boolean;
  memberOf?: string[];
}

interface IdentityListResponse {
  value: RawIdentity[];
}

function toIdentity(raw: RawIdentity): Identity {
  return {
    descriptor: raw.descriptor,
    // On-prem identities sometimes lack providerDisplayName — fall back.
    displayName: raw.providerDisplayName ?? raw.customDisplayName ?? raw.descriptor,
    isGroup: raw.isContainer,
  };
}

/** descriptors are passed in the query string; too many at once overflow the URL → HTTP 404/414. */
const DESCRIPTOR_CHUNK = 20;

export class IdentityService {
  constructor(private api: ApiClient) {}

  /** Look up identities by descriptor, chunked so the query string never overflows. */
  private async getByDescriptors(descriptors: string[], extraQuery = ''): Promise<RawIdentity[]> {
    const out: RawIdentity[] = [];
    for (let i = 0; i < descriptors.length; i += DESCRIPTOR_CHUNK) {
      const chunk = descriptors.slice(i, i + DESCRIPTOR_CHUNK);
      const res = await this.api.get<IdentityListResponse>(
        `/_apis/identities?descriptors=${chunk.map(encodeURIComponent).join(',')}${extraQuery}&api-version=6.0`
      );
      out.push(...res.value);
    }
    return out;
  }

  /** Fuzzy search over users and groups in the collection. */
  async search(query: string): Promise<Identity[]> {
    const res = await this.api.get<IdentityListResponse>(
      `/_apis/identities?searchFilter=General&filterValue=${encodeURIComponent(query)}&api-version=6.0`
    );
    return res.value.map(toIdentity);
  }

  /** [identity itself, ...all groups it belongs to, transitively]. Cycle-safe. */
  async expandMembership(identity: Identity): Promise<Identity[]> {
    const result: Identity[] = [identity];
    const seen = new Set<string>([identity.descriptor]);
    let frontier = [identity.descriptor];
    while (frontier.length > 0) {
      const raws = await this.getByDescriptors(frontier, '&queryMembership=Direct');
      const next: string[] = [];
      for (const raw of raws) {
        for (const parent of raw.memberOf ?? []) {
          if (!seen.has(parent)) {
            seen.add(parent);
            next.push(parent);
          }
        }
      }
      if (next.length > 0) {
        const parents = await this.getByDescriptors(next);
        result.push(...parents.map(toIdentity));
      }
      frontier = next;
    }
    return result;
  }
}
