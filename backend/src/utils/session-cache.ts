/**
 * Lightweight in-memory session cache.
 *
 * Avoids hitting the database on every authenticated request by caching
 * resolved session data (userId + sessionStartedAt) keyed by the
 * session token / JWT.
 *
 * - Entries auto-expire after TTL (default 5 min)
 * - Stale entries are pruned lazily on every `get` and periodically
 * - Memory-bounded: evicts oldest entries when max size is reached
 */

interface CacheEntry {
  userId: bigint;
  sessionStartedAt?: Date;
  expiresAt: number; // Date.now() + TTL
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 10_000;
const PRUNE_INTERVAL_MS = 60 * 1000; // every 60 s

const cache = new Map<string, CacheEntry>();

// Periodic pruning so the map doesn't grow unbounded
const pruneTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}, PRUNE_INTERVAL_MS);
pruneTimer.unref(); // don't keep the process alive

export const sessionCache = {
  get(token: string): CacheEntry | undefined {
    const entry = cache.get(token);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      cache.delete(token);
      return undefined;
    }
    return entry;
  },

  set(token: string, userId: bigint, sessionStartedAt?: Date) {
    // Evict oldest if at capacity
    if (cache.size >= MAX_ENTRIES) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(token, {
      userId,
      sessionStartedAt,
      expiresAt: Date.now() + TTL_MS,
    });
  },

  invalidate(token: string) {
    cache.delete(token);
  },

  clear() {
    cache.clear();
  },

  get size() {
    return cache.size;
  },
};
