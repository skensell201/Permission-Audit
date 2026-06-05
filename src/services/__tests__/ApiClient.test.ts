import { RestApiClient, ApiError } from '../ApiClient';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('RestApiClient', () => {
  it('GETs a path with auth header and parses JSON', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { value: [1] }));
    const client = new RestApiClient('http://srv/DefaultCollection', 'tok', fetchFn, () => Promise.resolve());
    const result = await client.get<{ value: number[] }>('/_apis/projects?api-version=6.0');
    expect(result).toEqual({ value: [1] });
    expect(fetchFn).toHaveBeenCalledWith(
      'http://srv/DefaultCollection/_apis/projects?api-version=6.0',
      { headers: { Authorization: 'Bearer tok', Accept: 'application/json' } }
    );
  });

  it('retries on 429 then succeeds', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const client = new RestApiClient('http://srv', 'tok', fetchFn, () => Promise.resolve());
    expect(await client.get('/x')).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 at most 3 times then throws ApiError', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(503, {}));
    const client = new RestApiClient('http://srv', 'tok', fetchFn, () => Promise.resolve());
    await expect(client.get('/x')).rejects.toThrow(ApiError);
    expect(fetchFn).toHaveBeenCalledTimes(4); // initial + 3 retries
  });

  it('throws ApiError with status on 403 without retrying', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(403, {}));
    const client = new RestApiClient('http://srv', 'tok', fetchFn, () => Promise.resolve());
    await expect(client.get('/x')).rejects.toMatchObject({ status: 403 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
