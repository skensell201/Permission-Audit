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

export class IdentityService {
  constructor(private api: ApiClient) {}

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
      const res = await this.api.get<IdentityListResponse>(
        `/_apis/identities?descriptors=${frontier.map(encodeURIComponent).join(',')}&queryMembership=Direct&api-version=6.0`
      );
      const next: string[] = [];
      for (const raw of res.value) {
        for (const parent of raw.memberOf ?? []) {
          if (!seen.has(parent)) {
            seen.add(parent);
            next.push(parent);
          }
        }
      }
      if (next.length > 0) {
        const parents = await this.api.get<IdentityListResponse>(
          `/_apis/identities?descriptors=${next.map(encodeURIComponent).join(',')}&api-version=6.0`
        );
        result.push(...parents.value.map(toIdentity));
      }
      frontier = next;
    }
    return result;
  }
}
