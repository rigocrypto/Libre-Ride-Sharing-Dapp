/**
 * Shared helpers for tolerating transient PostgreSQL connection failures.
 *
 * Neon's free tier sleeps aggressively and our pool keeps `min: 0` connections,
 * so the first query after an idle period frequently hits a cold-start
 * connection timeout. These are safe to retry; real SQL errors (missing column,
 * bad syntax, unique violation) are not and must surface immediately.
 */

// Node socket-level errors that indicate a dropped/refused/unreachable
// connection rather than a problem with the query itself.
const transientSocketCodes = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "EPIPE",
  "ENOTFOUND",
  "ENETUNREACH",
  "EHOSTUNREACH",
]);

// PostgreSQL SQLSTATE codes meaning the server was unavailable or closed the
// connection — exactly what Neon's scale-to-zero produces on the first request
// after an idle period. These are safe to retry. Data/logic errors (class 22
// data, 23 integrity, 42 syntax/undefined-column) are deliberately excluded so
// real bugs still surface as 500 immediately.
const transientPgSqlStates = new Set([
  "57P01", // admin_shutdown — "terminating connection due to administrator command"
  "57P03", // cannot_connect_now — "the database system is starting up"
  "08000", // connection_exception
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08003", // connection_does_not_exist
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
  "08006", // connection_failure
  "08007", // transaction_resolution_unknown
  "08P01", // protocol_violation at the connection level
]);

const transientMessageFragments = [
  "connection timeout",
  "connection terminated",
  "timeout exceeded",
  "terminating connection due to administrator command",
  "the database system is starting up",
  "server closed the connection unexpectedly",
  "socket hang up",
  "client has encountered a connection error",
  "etimedout",
  "econnreset",
  "econnrefused",
];

export function isTransientConnectionError(error: any): boolean {
  if (!error) return false;
  const code = typeof error.code === "string" ? error.code : "";
  if (transientSocketCodes.has(code)) return true;
  if (transientPgSqlStates.has(code)) return true;
  if (error.cause && isTransientConnectionError(error.cause)) return true;
  const message = String(error.message ?? "").toLowerCase();
  return transientMessageFragments.some((fragment) => message.includes(fragment));
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
