import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import type { AuditAction, AuditLogEntry } from "@shared/audit/types";

export type CreateAuditLogEntry = {
  actorId: string;
  actorRole?: string;
  actorWallet?: string;
  action: AuditAction;
  rideId?: string;
  previousState?: string;
  nextState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

const auditEntries: AuditLogEntry[] = [];

function shouldUsePersistentAuditLog(): boolean {
  const engine = process.env.STORAGE_ENGINE;
  return !!process.env.DATABASE_URL && engine !== "mem" && process.env.NODE_ENV !== "test";
}

function mapDbAuditLog(row: any): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actorUserId,
    actorRole: row.actorRole,
    actorWallet: row.actorWallet || undefined,
    action: row.actionType,
    rideId: row.rideId || undefined,
    previousState: row.previousEscrowState || undefined,
    nextState: row.nextEscrowState || undefined,
    reason: row.reason || undefined,
    metadata: row.metadata || undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

export async function appendAuditLogEntry(
  entry: CreateAuditLogEntry
): Promise<AuditLogEntry> {
  if (shouldUsePersistentAuditLog()) {
    const [{ db }, { auditLogs }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    const [inserted] = await db
      .insert(auditLogs)
      .values({
        actorUserId: entry.actorId,
        actorRole: entry.actorRole || "admin",
        actorWallet: entry.actorWallet || null,
        actionType: entry.action,
        rideId: entry.rideId || null,
        previousEscrowState: entry.previousState || null,
        nextEscrowState: entry.nextState || null,
        reason: entry.reason || null,
        metadata: entry.metadata || null,
      })
      .returning();
    return mapDbAuditLog(inserted);
  }

  const auditEntry: AuditLogEntry = {
    id: randomUUID(),
    actorRole: entry.actorRole || "admin",
    ...entry,
    createdAt: new Date(),
  };

  auditEntries.push(auditEntry);
  return auditEntry;
}

export async function getAuditLogForRide(rideId: string): Promise<AuditLogEntry[]> {
  if (shouldUsePersistentAuditLog()) {
    const [{ db }, { auditLogs }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.rideId, rideId))
      .orderBy(desc(auditLogs.createdAt));
    return rows.map(mapDbAuditLog);
  }

  return auditEntries
    .filter((entry) => entry.rideId === rideId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listAuditLogEntries(filters: {
  rideId?: string;
  actorId?: string;
  action?: AuditAction;
} = {}): Promise<AuditLogEntry[]> {
  if (shouldUsePersistentAuditLog()) {
    const [{ db }, { auditLogs }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    return rows
      .map(mapDbAuditLog)
      .filter((entry) => {
        if (filters.rideId && entry.rideId !== filters.rideId) return false;
        if (filters.actorId && entry.actorId !== filters.actorId) return false;
        if (filters.action && entry.action !== filters.action) return false;
        return true;
      });
  }

  return auditEntries
    .filter((entry) => {
      if (filters.rideId && entry.rideId !== filters.rideId) return false;
      if (filters.actorId && entry.actorId !== filters.actorId) return false;
      if (filters.action && entry.action !== filters.action) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function clearAuditLogForTests(): void {
  auditEntries.length = 0;
}
