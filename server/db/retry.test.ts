import { describe, expect, it, vi } from "vitest";
import { isTransientConnectionError, withDbRetry } from "./retry";

describe("isTransientConnectionError", () => {
  it("flags known transient error codes", () => {
    expect(isTransientConnectionError({ code: "ETIMEDOUT" })).toBe(true);
    expect(isTransientConnectionError({ code: "ECONNRESET" })).toBe(true);
    expect(isTransientConnectionError({ code: "ECONNREFUSED" })).toBe(true);
    expect(isTransientConnectionError({ code: "EAI_AGAIN" })).toBe(true);
  });

  it("flags transient messages even without a code", () => {
    expect(isTransientConnectionError(new Error("Connection terminated due to connection timeout"))).toBe(true);
    expect(isTransientConnectionError(new Error("timeout exceeded when establishing a connection"))).toBe(true);
  });

  it("flags Neon scale-to-zero / cold-start SQLSTATE codes", () => {
    // The exact signatures that returned 500 instead of a retryable 503 when
    // Neon was asleep on the first request after idle.
    expect(isTransientConnectionError({ code: "57P01", message: "terminating connection due to administrator command" })).toBe(true);
    expect(isTransientConnectionError({ code: "57P03", message: "the database system is starting up" })).toBe(true);
    expect(isTransientConnectionError({ code: "08006", message: "connection failure" })).toBe(true);
    expect(isTransientConnectionError({ code: "08001" })).toBe(true);
  });

  it("flags Neon cold-start signatures by message even without a known code", () => {
    expect(isTransientConnectionError(new Error("terminating connection due to administrator command"))).toBe(true);
    expect(isTransientConnectionError(new Error("the database system is starting up"))).toBe(true);
    expect(isTransientConnectionError(new Error("server closed the connection unexpectedly"))).toBe(true);
  });

  it("flags additional dropped-socket codes", () => {
    expect(isTransientConnectionError({ code: "EPIPE" })).toBe(true);
    expect(isTransientConnectionError({ code: "ENOTFOUND" })).toBe(true);
    expect(isTransientConnectionError({ code: "ENETUNREACH" })).toBe(true);
  });

  it("unwraps nested causes", () => {
    const err = new Error("wrapper");
    (err as any).cause = { code: "ETIMEDOUT" };
    expect(isTransientConnectionError(err)).toBe(true);
  });

  it("does NOT flag real SQL errors (missing column, unique violation, syntax)", () => {
    expect(isTransientConnectionError({ code: "23505", message: "duplicate key value" })).toBe(false);
    expect(isTransientConnectionError({ code: "42703", message: 'column "foo" does not exist' })).toBe(false);
    expect(isTransientConnectionError({ code: "23502", message: "null value in column violates not-null constraint" })).toBe(false);
    expect(isTransientConnectionError(new Error("syntax error at or near"))).toBe(false);
    // 57-class codes other than the two connection ones must NOT be retried.
    expect(isTransientConnectionError({ code: "57014", message: "canceling statement due to statement timeout" })).toBe(false);
    expect(isTransientConnectionError(null)).toBe(false);
  });
});

describe("withDbRetry", () => {
  it("returns the result on first success without retrying", async () => {
    const op = vi.fn(async () => "ok");
    const result = await withDbRetry(op, { baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    let calls = 0;
    const op = vi.fn(async () => {
      calls += 1;
      if (calls < 3) {
        const err: any = new Error("connection timeout");
        err.code = "ETIMEDOUT";
        throw err;
      }
      return "recovered";
    });
    const result = await withDbRetry(op, { baseDelayMs: 1 });
    expect(result).toBe("recovered");
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry non-transient errors", async () => {
    const op = vi.fn(async () => {
      const err: any = new Error("duplicate key value violates unique constraint");
      err.code = "23505";
      throw err;
    });
    await expect(withDbRetry(op, { baseDelayMs: 1 })).rejects.toThrow("duplicate key");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxAttempts on persistent transient errors", async () => {
    const op = vi.fn(async () => {
      const err: any = new Error("connection timeout");
      err.code = "ETIMEDOUT";
      throw err;
    });
    await expect(withDbRetry(op, { baseDelayMs: 1, maxAttempts: 3 })).rejects.toThrow("connection timeout");
    expect(op).toHaveBeenCalledTimes(3);
  });
});
