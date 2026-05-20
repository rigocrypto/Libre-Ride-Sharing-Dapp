import { randomUUID } from "node:crypto";
import type { AuditAction, AuditLogEntry } from "@shared/audit/types";

export type CreateAuditLogEntry = {
  actorId: string;
  actorWallet?: string;
  action: AuditAction;
  rideId?: string;
  previousState?: string;
  nextState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

const auditEntries: AuditLogEntry[] = [];

export async function appendAuditLogEntry(
  entry: CreateAuditLogEntry
): Promise<AuditLogEntry> {
  const auditEntry: AuditLogEntry = {
    id: randomUUID(),
    ...entry,
    createdAt: new Date(),
  };

  auditEntries.push(auditEntry);
  return auditEntry;
}

export async function getAuditLogForRide(rideId: string): Promise<AuditLogEntry[]> {
  return auditEntries
    .filter((entry) => entry.rideId === rideId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function clearAuditLogForTests(): void {
  auditEntries.length = 0;
}
