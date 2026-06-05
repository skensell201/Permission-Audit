import { runBatched } from '../batch';

describe('runBatched', () => {
  it('returns results in input order', async () => {
    const results = await runBatched([3, 1, 2], async (n) => {
      await new Promise((r) => setTimeout(r, n * 10));
      return n * 2;
    });
    expect(results).toEqual([6, 2, 4]);
  });

  it('never exceeds the concurrency limit', async () => {
    let active = 0;
    let maxActive = 0;
    await runBatched(
      Array.from({ length: 20 }, (_, i) => i),
      async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 5));
        active--;
      },
      6
    );
    expect(maxActive).toBeLessThanOrEqual(6);
  });

  it('handles an empty input', async () => {
    expect(await runBatched([], async (x) => x)).toEqual([]);
  });
});
