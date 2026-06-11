import { db } from "@server/db/client";
import {
  auditEvents,
  AuditEventType,
  InsertAuditEvent,
} from "@shared/schema";
import { Request } from "express";

/**
 * Create an immutable audit event for compliance tracking.
 * Every critical action (driver approval, insurance verification, eligibility change, etc.)
 * should emit an audit event for legal defense, dispute resolution, and regulatory review.
 *
 * This is append-only. No updates or deletes.
 */
export async function createAuditEvent(params: {
  eventType: AuditEventType;
  actorUserId?: string; // Who triggered it (admin, system, etc.)
  actorRole?: "driver" | "rider" | "admin" | "system";
  targetType: string; // "driver" | "ride" | "escrow" | "insurance" | "eligibility"
  targetId: string;
  rideId?: string;
  driverId?: string;
  riderId?: string;
  escrowTxHash?: string;
  metadata?: Record<string, any>;
  req?: Request; // To extract IP & user agent
}): Promise<string> {
  const {
    eventType,
    actorUserId,
    actorRole,
    targetType,
    targetId,
    rideId,
    driverId,
    riderId,
    escrowTxHash,
    metadata = {},
    req,
  } = params;

  const event: InsertAuditEvent = {
    eventType,
    actorUserId: actorUserId || null,
    actorRole: actorRole || null,
    targetType,
    targetId,
    rideId: rideId || null,
    driverId: driverId || null,
    riderId: riderId || null,
    escrowTxHash: escrowTxHash || null,
    metadata,
    ipAddress: req?.ip || null,
    userAgent: req?.get("user-agent") || null,
  };

  const result = await db.insert(auditEvents).values(event).returning();
  return result[0].id;
}

/**
 * Get audit trail for a driver (for admin review & disputes)
 */
export async function getDriverAuditTrail(driverId: string) {
  return await db.query.auditEvents.findMany({
    where: (events, { or, and, eq }) =>
      or(
        eq(events.driverId, driverId),
        and(
          eq(events.targetType, "driver"),
          eq(events.targetId, driverId)
        )
      ),
    orderBy: (events, { desc }) => desc(events.createdAt),
    limit: 100,
  });
}

/**
 * Get audit trail for a ride (for disputes & insurance claims)
 */
export async function getRideAuditTrail(rideId: string) {
  return await db.query.auditEvents.findMany({
    where: (events, { or, and, eq }) =>
      or(
        eq(events.rideId, rideId),
        and(
          eq(events.targetType, "ride"),
          eq(events.targetId, rideId)
        )
      ),
    orderBy: (events, { desc }) => desc(events.createdAt),
    limit: 50,
  });
}

/**
 * Get all events of a specific type (for batch operations, compliance review)
 */
export async function getEventsByType(eventType: AuditEventType, limit: number = 1000) {
  return await db.query.auditEvents.findMany({
    where: (events, { eq }) => eq(events.eventType, eventType),
    orderBy: (events, { desc }) => desc(events.createdAt),
    limit,
  });
}

/**
 * Count audit events in a time window (for compliance reporting)
 */
export async function countEventsInWindow(
  startDate: Date,
  endDate: Date,
  eventType?: AuditEventType
) {
  // This is a simplified example - you'd use raw SQL for a real count
  const events = await db.query.auditEvents.findMany({
    where: (events, { and, gte, lte, eq }) => {
      const timeCondition = and(
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      );
      if (eventType) {
        return and(timeCondition, eq(events.eventType, eventType));
      }
      return timeCondition;
    },
  });
  return events.length;
}
