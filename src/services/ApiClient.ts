export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
}

const RETRYABLE = new Set([429, 503]);
const MAX_RETRIES = 3;

export class RestApiClient implements ApiClient {
  constructor(
    private baseUrl: string,
    private token: string,
    private fetchFn: typeof fetch = fetch.bind(globalThis),
    /** Injectable so tests do not really sleep. */
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))
  ) {}

  async get<T>(path: string): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const res = await this.fetchFn(`${this.baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
      });
      if (RETRYABLE.has(res.status) && attempt < MAX_RETRIES) {
        await this.sleep(500 * 2 ** attempt);
        continue;
      }
      if (!res.ok) throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
      return (await res.json()) as T;
    }
  }
}
