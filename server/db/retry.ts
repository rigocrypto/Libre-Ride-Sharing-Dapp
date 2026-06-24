/**
 * Shared helpers for tolerating transient PostgreSQL connection failures.
 *
 * Neon's free tier sleeps aggressively and our pool keeps `min: 0` connections,
 * so the first query after an idle period frequently hits a cold-start
 * connection timeout. These are safe to retry; real SQL errors (missing column,
 * bad syntax, unique violation) are not and must surface immediately.
 */

const transientConnectionCodes = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

export function isTransientConnectionError(error: any): boolean {
  if (!error) return false;
  if (transientConnectionCodes.has(error.code)) return true;
  if (error.cause && isTransientConnectionError(error.cause)) return true;
  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("connection timeout") ||
    message.includes("connection terminated") ||
    message.includes("timeout exceeded") ||
    message.includes("etimedout") ||
    message.includes("econnreset") ||
    message.includes("econnrefused")
  );
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface DbRetryOptions {
  /** Total attempts including the first. Default 3. */
  maxAttempts?: number;
  /** Base backoff in ms; doubles each attempt (1s, 2s, 4s by default). */
  baseDelayMs?: number;
  /** Label used in retry log lines. */
  label?: string;
}

/**
 * Runs `operation`, retrying only on transient connection errors with
 * exponential backoff. Non-transient errors (and the final attempt) are
 * rethrown untouched so callers can map them to 400/409/500 as appropriate.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: DbRetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const label = options.label ?? "db operation";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt || !isTransientConnectionError(error)) {
        throw error;
      }
      const backoffMs = baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `[DB] ${label} attempt ${attempt}/${maxAttempts} failed with transient connection error: ${error.message}. Retrying in ${backoffMs}ms...`,
      );
      await delay(backoffMs);
    }
  }

  // Unreachable: the loop either returns or throws on the last attempt.
  throw new Error(`[DB] ${label} exhausted retries`);
}
