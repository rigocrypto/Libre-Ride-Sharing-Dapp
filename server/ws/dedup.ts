/**
 * WebSocket Dedup Utility
 *
 * Prevent duplicate event broadcasts using a simple in-memory Set.
 * TTL: 60 seconds per event (auto-cleanup via expiry).
 *
 * In production, use Redis with SETEX for distributed dedup.
 *
 * Keys follow the pattern:
 * - ride:${rideId}:accepted (emitted when acceptance is confirmed)
 * - ride:${rideId}:withdrawn (emitted when ride withdrawn to other drivers)
 */

interface DedupEntry {
  expiresAt: number;
}

const dedupStore = new Map<string, DedupEntry>();

const DEDUP_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Check if an event has already been emitted.
 * Auto-cleanup expired entries.
 */
export function hasEmitted(key: string): boolean {
  const entry = dedupStore.get(key);

  if (!entry) {
    return false;
  }

  // Expired?
  if (entry.expiresAt < Date.now()) {
    dedupStore.delete(key);
    return false;
  }

  return true;
}

/**
 * Mark an event as emitted.
 * Sets TTL for auto-cleanup.
 */
export function markEmitted(key: string): void {
  dedupStore.set(key, {
    expiresAt: Date.now() + DEDUP_TTL_MS,
  });
}

/**
 * Emit exactly once within TTL window.
 *
 * Usage:
 * ```
 * emitOnce(`ride:${rideId}:accepted`, () => {
 *   io.emit('ride.accepted', { rideId, driverId });
 * });
 * ```
 */
export function emitOnce(key: string, emitFn: () => void): void {
  if (hasEmitted(key)) {
    console.log(`[WS Dedup] Skip (already emitted): ${key}`);
    return;
  }

  console.log(`[WS Dedup] Emit: ${key}`);
  emitFn();
  markEmitted(key);
}

/**
 * Clear all dedup entries (useful for testing/resets)
 */
export function clearDedup(): void {
  dedupStore.clear();
}

/**
 * Get current dedup store size (for monitoring)
 */
export function getDedupSize(): number {
  return dedupStore.size;
}
