/**
 * Centralized FIFO RPC Queue, In-Flight Deduplication, Safe Caching, and Journey Budget Tracking.
 *
 * Invariants:
 * - Single-slot FIFO queue (concurrency = 1)
 * - In-flight read deduplication
 * - 10-second safe cache
 * - Journey metrics track actual network calls (not cache hits or dedup hits)
 * - Retry-After support for integer seconds and HTTP-date with bounded max
 * - AbortSignal support for request cancellation on view unmount
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface RpcMetrics {
  totalRequests: number;
  cacheHits: number;
  dedupHits: number;
  networkCalls: number;
  journeyCalls: Record<string, number>;
  activeConcurrency: number;
  peakConcurrency: number;
}

export const JOURNEY_NETWORK_BUDGETS: Record<string, number> = {
  overview: 4,
  publisher: 5,
  localizer: 5,
  assess: 5,
  publish: 5,
  consumer: 4,
  audit: 5,
};

export class RpcBudgetExecutor {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private defaultTtlMs = 10_000; // 10-second safe cache
  private activeConcurrency = 0;
  private peakConcurrency = 0;
  private cooldownUntil = 0;
  private journeyGeneration = new Map<string, number>();
  private journeyWindows = new Map<string, { startedAt: number; calls: number }>();

  public cancelJourney(journey: string): void {
    this.journeyGeneration.set(journey, (this.journeyGeneration.get(journey) ?? 0) + 1);
  }

  private metrics: RpcMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    dedupHits: 0,
    networkCalls: 0,
    journeyCalls: {
      overview: 0,
      publisher: 0,
      localizer: 0,
      assess: 0,
      publish: 0,
      consumer: 0,
      audit: 0,
    },
    activeConcurrency: 0,
    peakConcurrency: 0,
  };

  /**
   * Execute a read operation with deduplication, caching, and rate limit protection.
   */
  public async execute<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttlMs?: number;
      bypassCache?: boolean;
      journey?: string;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    this.metrics.totalRequests++;

    const ttl = options?.ttlMs ?? this.defaultTtlMs;
    const now = Date.now();
    const journey = options?.journey;
    const generation = journey ? (this.journeyGeneration.get(journey) ?? 0) : 0;
    const inFlightKey = `${journey ?? 'shared'}:${key}`;

    // 1. Check Safe Cache (does NOT consume journey network budget)
    if (!options?.bypassCache) {
      const cached = this.cache.get(key);
      if (cached && now - cached.timestamp < ttl) {
        this.metrics.cacheHits++;
        return cached.data as T;
      }
    }

    // 2. Check In-Flight Deduplication (does NOT consume extra journey network budget)
    if (this.inFlight.has(inFlightKey)) {
      this.metrics.dedupHits++;
      return this.inFlight.get(inFlightKey) as Promise<T>;
    }

    // Check immediate abortion
    if (options?.signal?.aborted) {
      throw new DOMException('RPC call was aborted before execution.', 'AbortError');
    }

    // 3. Queue and Execute via FIFO single-slot queue
    const promise = new Promise<T>((resolve, reject) => {
      const task = async () => {
        if (
          options?.signal?.aborted ||
          (journey !== undefined && (this.journeyGeneration.get(journey) ?? 0) !== generation)
        ) {
          this.inFlight.delete(inFlightKey);
          reject(new DOMException('RPC call aborted while queued.', 'AbortError'));
          return;
        }

        this.activeConcurrency++;
        if (this.activeConcurrency > this.peakConcurrency) {
          this.peakConcurrency = this.activeConcurrency;
        }
        this.metrics.activeConcurrency = this.activeConcurrency;
        this.metrics.peakConcurrency = this.peakConcurrency;

        try {
          // Check shared cooldown
          if (this.cooldownUntil > Date.now()) {
            const delay = this.cooldownUntil - Date.now();
            await new Promise((r) => setTimeout(r, delay));
          }

          // Count actual network call under journey budget
          if (journey) {
            const current = this.journeyWindows.get(journey);
            const windowState = !current || Date.now() - current.startedAt >= this.defaultTtlMs
              ? { startedAt: Date.now(), calls: 0 }
              : current;
            const budget = JOURNEY_NETWORK_BUDGETS[journey];
            if (budget !== undefined && windowState.calls >= budget) {
              throw new Error(`RPC network budget exceeded for '${journey}'. Retry after the cache window.`);
            }
            windowState.calls++;
            this.journeyWindows.set(journey, windowState);
          }
          this.metrics.networkCalls++;
          if (journey && journey in this.metrics.journeyCalls) {
            this.metrics.journeyCalls[journey]++;
          }

          const result = await this.executeWithRetry(fetcher, options?.signal);

          if (journey !== undefined && (this.journeyGeneration.get(journey) ?? 0) !== generation) {
            throw new DOMException('RPC result belongs to an inactive journey.', 'AbortError');
          }

          // Store validated non-error result in cache
          this.cache.set(key, { data: result, timestamp: Date.now() });
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeConcurrency--;
          this.metrics.activeConcurrency = this.activeConcurrency;
          this.inFlight.delete(inFlightKey);
        }
      };

      this.queue.push(task);
      this.processQueue();
    });

    this.inFlight.set(inFlightKey, promise);
    return promise;
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    signal?: AbortSignal,
    maxRetries: number = 3,
    baseDelayMs: number = 500
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Aborted during retry loop', 'AbortError');
      }

      try {
        return await fn();
      } catch (err: unknown) {
        attempt++;
        const errObj = err as {
          status?: number;
          code?: number;
          message?: string;
          headers?: { get?: (k: string) => string | null } | Headers;
        };

        const status = errObj.status || 0;
        const isRateLimit = status === 429 || (errObj.message && errObj.message.includes('429'));
        const is5xx = status >= 500 && status <= 599;

        if ((isRateLimit || is5xx) && attempt <= maxRetries) {
          let delayMs = baseDelayMs * Math.pow(2, attempt - 1);

          // Parse Retry-After (seconds or HTTP date)
          if (errObj.headers && typeof (errObj.headers as any).get === 'function') {
            const retryAfter = (errObj.headers as any).get('Retry-After');
            if (retryAfter) {
              const parsedInt = parseInt(retryAfter, 10);
              if (!isNaN(parsedInt) && parsedInt > 0) {
                delayMs = Math.min(parsedInt * 1000, 10000);
              } else {
                const parsedDate = Date.parse(retryAfter);
                if (!isNaN(parsedDate)) {
                  const diff = parsedDate - Date.now();
                  if (diff > 0) {
                    delayMs = Math.min(diff, 10000);
                  }
                }
              }
            }
          }

          const jitter = Math.floor(Math.random() * 200);
          const totalDelay = Math.min(delayMs + jitter, 10000);

          this.cooldownUntil = Date.now() + totalDelay;
          await new Promise((r) => setTimeout(r, totalDelay));
          continue;
        }

        throw err;
      }
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch {
          // Task errors are handled via promise rejection
        }
      }
    }

    this.isProcessing = false;
  }

  public invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  public getMetrics(): RpcMetrics {
    return {
      ...this.metrics,
      journeyCalls: { ...this.metrics.journeyCalls },
      activeConcurrency: this.activeConcurrency,
      peakConcurrency: this.peakConcurrency,
    };
  }

  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      dedupHits: 0,
      networkCalls: 0,
      journeyCalls: {
        overview: 0,
        publisher: 0,
        localizer: 0,
        assess: 0,
        publish: 0,
        consumer: 0,
        audit: 0,
      },
      activeConcurrency: 0,
      peakConcurrency: 0,
    };
    this.peakConcurrency = 0;
    this.journeyWindows.clear();
  }
}

export const rpcExecutor = new RpcBudgetExecutor();
