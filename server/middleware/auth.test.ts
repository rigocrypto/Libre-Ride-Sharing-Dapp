import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

import { requireRole } from "./auth";

function mockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: any; json: any };
}

describe("requireRole", () => {
  it("rejects non-admin access to admin-only routes", () => {
    const req = {
      user: {
        userId: "driver-1",
        firebaseUid: "driver-1",
        role: "driver",
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn() as NextFunction;

    requireRole("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Forbidden" })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
