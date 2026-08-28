import { describe, it, expect, beforeEach } from 'vitest';
import { JOURNEY_NETWORK_BUDGETS, RpcBudgetExecutor } from '../services/rpcBudget';

describe('RPC Budget Executor, Deduplication & Safe Caching', () => {
  let executor: RpcBudgetExecutor;

  beforeEach(() => {
    executor = new RpcBudgetExecutor();
  });

  it('enforces single-slot FIFO concurrency (concurrency strictly capped at 1)', async () => {
    let running = 0;
    let maxRunning = 0;
    const order: number[] = [];

    const makeTask = (id: number, delayMs: number) => async () => {
      running++;
      if (running > maxRunning) maxRunning = running;
      await new Promise((r) => setTimeout(r, delayMs));
      order.push(id);
      running--;
      return id;
    };

    const promises = [
      executor.execute('k1', makeTask(1, 30)),
      executor.execute('k2', makeTask(2, 20)),
      executor.execute('k3', makeTask(3, 10)),
    ];

    const results = await Promise.all(promises);

    expect(results).toEqual([1, 2, 3]);
    expect(maxRunning).toBe(1); // Never exceeded concurrency limit of 1
    expect(order).toEqual([1, 2, 3]); // Preserved FIFO submission order
  });

  it('deduplicates concurrent in-flight requests for the same key', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return { value: 'data-1' };
    };

    const key = 'test:dedup:key';
    const [res1, res2, res3] = await Promise.all([
      executor.execute(key, fetcher, { journey: 'publisher' }),
      executor.execute(key, fetcher, { journey: 'publisher' }),
      executor.execute(key, fetcher, { journey: 'publisher' }),
    ]);

    expect(callCount).toBe(1);
    expect(res1).toEqual({ value: 'data-1' });
    expect(res2).toEqual({ value: 'data-1' });
    expect(res3).toEqual({ value: 'data-1' });

    const metrics = executor.getMetrics();
    expect(metrics.totalRequests).toBe(3);
    expect(metrics.dedupHits).toBe(2);
    expect(metrics.networkCalls).toBe(1);
    expect(metrics.journeyCalls.publisher).toBe(1);
  });

  it('serves subsequent requests from cache within TTL', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { value: 'cached-data' };
    };

    const key = 'test:cache:key';
    const res1 = await executor.execute(key, fetcher, { ttlMs: 5000, journey: 'localizer' });
    const res2 = await executor.execute(key, fetcher, { ttlMs: 5000, journey: 'localizer' });

    expect(callCount).toBe(1);
    expect(res1).toEqual(res2);

    const metrics = executor.getMetrics();
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.networkCalls).toBe(1);
    expect(metrics.journeyCalls.localizer).toBe(1);
  });

  it('invalidates cache properly', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { count: callCount };
    };

    const key = 'test:invalidation:key';
    await executor.execute(key, fetcher);
    expect(callCount).toBe(1);

    // Invalidate
    executor.invalidate();

    const res2 = await executor.execute(key, fetcher);
    expect(callCount).toBe(2);
    expect(res2.count).toBe(2);
  });

  it('accurately tracks all 6 journey network metrics', async () => {
    const fetcher = async () => 'ok';

    await executor.execute('k1', fetcher, { journey: 'publisher' });
    await executor.execute('k2', fetcher, { journey: 'localizer' });
    await executor.execute('k3', fetcher, { journey: 'assess' });
    await executor.execute('k4', fetcher, { journey: 'publish' });
    await executor.execute('k5', fetcher, { journey: 'consumer' });
    await executor.execute('k6', fetcher, { journey: 'audit' });

    const metrics = executor.getMetrics();
    expect(metrics.networkCalls).toBe(6);
    expect(metrics.journeyCalls.publisher).toBe(1);
    expect(metrics.journeyCalls.localizer).toBe(1);
    expect(metrics.journeyCalls.assess).toBe(1);
    expect(metrics.journeyCalls.publish).toBe(1);
    expect(metrics.journeyCalls.consumer).toBe(1);
    expect(metrics.journeyCalls.audit).toBe(1);
  });

  it('supports request cancellation via AbortSignal', async () => {
    const controller = new AbortController();
    const fetcher = async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'done';
    };

    controller.abort();

    await expect(
      executor.execute('cancelled_key', fetcher, { signal: controller.signal })
    ).rejects.toThrow(/aborted/i);
  });

  it('enforces the journey network budget while cache and dedup hits remain free', async () => {
    const budget = JOURNEY_NETWORK_BUDGETS.consumer;
    for (let i = 0; i < budget; i++) {
      await executor.execute(`budget-${i}`, async () => i, { journey: 'consumer' });
    }
    await expect(
      executor.execute('budget-overflow', async () => 99, { journey: 'consumer' })
    ).rejects.toThrow(/budget exceeded/i);
    expect(executor.getMetrics().networkCalls).toBe(budget);
  });

  it('cancels queued work for a journey after navigation', async () => {
    const blocker = executor.execute('blocker', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'done';
    });
    const obsolete = executor.execute('obsolete', async () => 'wrong', { journey: 'audit' });
    executor.cancelJourney('audit');
    await blocker;
    await expect(obsolete).rejects.toThrow(/aborted/i);
  });

  it('does not share a cancelled in-flight promise across journeys', async () => {
    let calls = 0;
    let releaseFirst!: () => void;
    const firstBlocked = new Promise<void>((resolve) => { releaseFirst = resolve; });

    const overview = executor.execute('shared-profile', async () => {
      calls++;
      await firstBlocked;
      return 'overview';
    }, { journey: 'overview' });
    const localizer = executor.execute('shared-profile', async () => {
      calls++;
      return 'localizer';
    }, { journey: 'localizer' });

    executor.cancelJourney('overview');
    releaseFirst();

    await expect(overview).rejects.toThrow(/inactive journey/i);
    await expect(localizer).resolves.toBe('localizer');
    expect(calls).toBe(2);
  });
});
