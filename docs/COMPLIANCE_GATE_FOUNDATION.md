# Compliance Gate Foundation - Implementation Guide

**Status:** Phase 1A Complete — Database schema, eligibility service, and API endpoints ready for testing.

**What was built:** Three core tables (audit_events, insurance_policies, driver_eligibility_snapshots) plus calculation service + API routes.

---

## What's New

### 1. **Audit Events Table** (`audit_events`)
- **Purpose:** Immutable append-only log of every critical action (driver approval, insurance verification, ride events, escrow transactions)
- **Why:** Legal defense, dispute resolution, regulatory compliance, audit trails
- **Key rule:** No updates, no deletes. Only inserts.
- **Event types:** 25 event types defined (DRIVER_CREATED, INSURANCE_APPROVED, RIDE_STARTED, ESCROW_FUNDED, etc.)

### 2. **Insurance Policies Table** (`insurance_policies`)
- **Purpose:** Track driver insurance with carrier, policy number, effective/expiration dates, TNC endorsement status
- **Status flow:** `pending` → `approved` | `rejected` | `expired`
- **Hard rule:** Driver **cannot go online** unless latest insurance is approved AND not expired AND has TNC/commercial coverage
- **Admin action:** Only admins verify insurance; drivers cannot self-certify

### 3. **Driver Eligibility Snapshots Table** (`driver_eligibility_snapshots`)
- **Purpose:** Single source of truth for ride-gating decisions
- **What it tracks:** 8 individual verification gates + 3 composite eligibility flags
- **Versioning:** Snapshots linked to previous versions for audit trail
- **Auto-update:** Recalculated whenever compliance status changes

---

## Schema Overview

### Audit Events
```typescript
auditEvents {
  id: uuid                    // Primary key
  eventType: string           // Type from AUDIT_EVENT_TYPES constant
  actorUserId: uuid           // Who triggered (admin, system, etc.)
  actorRole: "driver"|"rider"|"admin"|"system"
  targetType: string          // "driver" | "ride" | "escrow" | "insurance"
  targetId: uuid              // The resource ID being acted on
  rideId: uuid                // Contextual IDs (denormalized for queries)
  driverId: uuid
  riderId: uuid
  escrowTxHash: string
  metadata: jsonb             // Event-specific data
  ipAddress: string           // For audit trail
  userAgent: string
  createdAt: timestamp        // Immutable (no updates)
}
```

### Insurance Policies
```typescript
insurancePolicies {
  id: uuid
  driverId: uuid              // FK to users
  vehicleId: uuid             // Optional FK
  carrierName: string         // e.g., "State Farm"
  policyNumber: string        // e.g., "POL-123456"
  coverageType: string        // "personal" | "commercial" | "tnc_endorsement"
  hasTncEndorsement: boolean  // Critical for TNC compliance
  hasCommercialCoverage: boolean
  coverageAmount: real        // In USD
  effectiveDate: string       // YYYY-MM-DD
  expirationDate: string      // YYYY-MM-DD
  documentUrl: string         // Upload file path
  documentHash: string        // For verification
  status: "pending"|"approved"|"rejected"|"expired"
  rejectionReason: string
  verifiedAt: timestamp       // When admin reviewed
  verifiedBy: uuid            // Which admin
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Driver Eligibility Snapshots
```typescript
driverEligibilitySnapshots {
  id: uuid
  driverId: uuid
  
  // Individual gates (each must be true for general ride eligibility)
  identityVerified: boolean
  licenseVerified: boolean
  backgroundCheckApproved: boolean
  insuranceVerified: boolean
  vehicleApproved: boolean
  vehicleInspectionApproved: boolean
  walletVerified: boolean
  
  // Optional gates
  airportEligible: boolean
  subscriptionActive: boolean
  
  // Composite eligibility (calculated from gates)
  canGoOnline: boolean                    // All 7 mandatory gates true
  canAcceptGeneralRides: boolean          // Same as canGoOnline
  canAcceptAirportRides: boolean          // canGoOnline && airportEligible
  
  blockingReasons: jsonb                  // Array of strings why gates failed
  warnings: jsonb                         // Non-blocking warnings
  
  calculatedAt: timestamp
  previousEligibilitySnapshotId: uuid     // For audit trail
}
```

---

## Eligibility Calculation Rules

**Hard gates** (all must be true to accept rides):
1. Identity verified
2. License verified
3. Background check approved
4. **Insurance verified** (approved status + not expired + TNC or commercial coverage)
5. Vehicle approved
6. Vehicle inspection approved
7. Wallet verified

**Airport gate** (optional):
- `canAcceptAirportRides = canAcceptGeneralRides AND airportEligible`

**Blocking flow:**
- If any hard gate is false → `canGoOnline = false` → driver cannot go online or accept rides
- If insurance status is `rejected` → blocking reason includes rejection reason
- If insurance is expired → warning added to warnings array

---

## API Endpoints

### Driver Submits Insurance
**POST** `/api/compliance/insurance`
```bash
Body: {
  driverId: "uuid",
  vehicleId: "uuid",
  carrierName: "State Farm",
  policyNumber: "POL-123456",
  coverageType: "tnc_endorsement",
  hasTncEndorsement: true,
  hasCommercialCoverage: false,
  coverageAmount: 1000000,
  effectiveDate: "2024-01-01",
  expirationDate: "2024-12-31",
  documentUrl: "s3://uploads/...",
  documentHash: "abc123..."
}

Response: {
  success: true,
  data: {
    id: "policy-123",
    status: "pending",
    message: "Insurance submitted for review..."
  }
}
```

### Get Driver Insurance History
**GET** `/api/compliance/insurance/:driverId`
```bash
Response: {
  success: true,
  data: [
    { id: "...", status: "approved", carrierName: "...", ... },
    { id: "...", status: "rejected", rejectionReason: "...", ... }
  ]
}
```

### Admin Approves Insurance
**POST** `/api/admin/compliance/insurance/:policyId/approve`
```bash
Response: {
  success: true,
  data: {
    policyId: "...",
    status: "approved",
    message: "Insurance approved. Driver eligibility updated."
  }
}
// Triggers: eligibility recalculation + audit event
```

### Admin Rejects Insurance
**POST** `/api/admin/compliance/insurance/:policyId/reject`
```bash
Body: {
  rejectionReason: "Policy does not include TNC endorsement"
}

Response: {
  success: true,
  data: {
    policyId: "...",
    status: "rejected",
    rejectionReason: "...",
    message: "Insurance rejected. Driver notified. Re-upload a corrected policy."
  }
}
// Triggers: eligibility recalculation + audit event
```

### Get Driver Eligibility Status
**GET** `/api/compliance/eligibility/:driverId`
```bash
Response: {
  success: true,
  data: {
    driverId: "...",
    canGoOnline: true,
    canAcceptGeneralRides: true,
    canAcceptAirportRides: false,
    blockingReasons: [],
    warnings: ["Insurance expiring in 30 days"],
    calculatedAt: "2025-05-29T...",
    
    // Individual gates (admin visibility)
    identityVerified: true,
    licenseVerified: true,
    backgroundCheckApproved: true,
    insuranceVerified: true,
    vehicleApproved: true,
    vehicleInspectionApproved: true,
    walletVerified: true,
    airportEligible: false
  }
}
```

### Get Eligibility History (Audit Trail)
**GET** `/api/compliance/eligibility/:driverId/history` (admin only)
```bash
Response: {
  success: true,
  data: [
    { id: "snap-3", calculatedAt: "...", canGoOnline: false, blockingReasons: [...], ... },
    { id: "snap-2", calculatedAt: "...", canGoOnline: true, blockingReasons: [], ... },
    { id: "snap-1", calculatedAt: "...", canGoOnline: false, blockingReasons: [...], ... }
  ]
}
```

### Force Recalculate Eligibility (Admin)
**POST** `/api/admin/compliance/drivers/:driverId/recalculate`
```bash
Response: {
  success: true,
  data: {
    driverId: "...",
    canGoOnline: true,
    canAcceptGeneralRides: true,
    canAcceptAirportRides: false,
    blockingReasons: [],
    calculatedAt: "2025-05-29T..."
  }
}
```

### Get Audit Trail for Driver (Admin)
**GET** `/api/admin/audit/drivers/:driverId`
```bash
Response: {
  success: true,
  data: [
    {
      id: "event-1",
      eventType: "INSURANCE_APPROVED",
      actorUserId: "admin-123",
      targetType: "insurance",
      targetId: "policy-123",
      driverId: "driver-456",
      metadata: { carrierName: "...", ... },
      createdAt: "2025-05-29T..."
    },
    { eventType: "DRIVER_ELIGIBILITY_RECALCULATED", ... },
    { eventType: "INSURANCE_SUBMITTED", ... }
  ]
}
```

### Get Audit Trail for Ride (Admin/Support)
**GET** `/api/admin/audit/rides/:rideId`
```bash
Response: {
  success: true,
  data: [
    { eventType: "RIDE_REQUESTED", ... },
    { eventType: "RIDE_ACCEPTED", ... },
    { eventType: "ESCROW_FUNDED", ... },
    { eventType: "RIDE_STARTED", ... },
    { eventType: "RIDE_COMPLETED", ... }
  ]
}
```

---

## Enforcement Rules (Next Steps)

### 🛑 Critical: Ride Acceptance Enforcement

When a driver tries to **go online** or **accept a ride**:

1. Check driver's current eligibility snapshot
2. Verify `canGoOnline = true` (or `canAcceptGeneralRides = true` for general rides)
3. Verify `canAcceptAirportRides = true` for airport rides
4. **If false:** Block the action, return blocking reasons
5. Create audit event: `RIDE_ACCEPTANCE_BLOCKED` or `RIDE_ACCEPTED`

**Pseudo-code:**
```typescript
async function acceptRide(driverId, rideId) {
  const eligibility = await getDriverEligibility(driverId);
  
  if (!eligibility.canAcceptGeneralRides) {
    await createAuditEvent({
      eventType: 'RIDE_ACCEPTANCE_BLOCKED',
      driverId,
      rideId,
      metadata: { blockingReasons: eligibility.blockingReasons }
    });
    throw new Error(`Cannot accept ride. ${eligibility.blockingReasons.join(', ')}`);
  }
  
  // Accept ride...
}
```

### 🛑 Critical: Ride Start Enforcement (PIN Verification)

When a ride is about to `START`:

1. Generate a 4-digit PIN for the rider
2. Driver must enter PIN before ride can transition to RIDE_STARTED
3. Create audit event: `PIN_VERIFICATION_CREATED` → `PIN_VERIFICATION_PASSED`

This prevents:
- Wrong passenger pickups
- Fake "started" events
- Escrow releases without actual ride start

---

## How to Use in Code

### Calculate Eligibility
```typescript
import { calculateDriverEligibility, getDriverEligibility } from "@server/lib/compliance/driver-eligibility";

// Option 1: Calculate from scratch
const eligibility = await calculateDriverEligibility(driverId);

// Option 2: Get cached snapshot
const snapshot = await getDriverEligibility(driverId);
if (!snapshot?.canAcceptGeneralRides) {
  throw new Error("Driver not eligible for rides");
}
```

### Create Audit Event
```typescript
import { createAuditEvent } from "@server/lib/compliance/audit-events";

await createAuditEvent({
  eventType: "RIDE_ACCEPTED",
  actorUserId: driverId,
  actorRole: "driver",
  targetType: "ride",
  targetId: rideId,
  rideId,
  driverId,
  metadata: {
    pickupLocation: pickup,
    fare: fare,
  },
  req, // Optional: extract IP & user agent
});
```

### Get Audit Trail
```typescript
import { getDriverAuditTrail, getRideAuditTrail } from "@server/lib/compliance/audit-events";

const driverEvents = await getDriverAuditTrail(driverId);
const rideEvents = await getRideAuditTrail(rideId);
```

---

## Testing Checklist

### Unit Tests
- [ ] Eligibility calculation: all gates false → canGoOnline = false
- [ ] Eligibility calculation: all gates true → canGoOnline = true
- [ ] Insurance verification: status "approved" + not expired + TNC = verified
- [ ] Insurance verification: status "rejected" = not verified
- [ ] Insurance verification: expired date < today = not verified
- [ ] Audit event creation: immutable (no deletes, no updates)
- [ ] Eligibility snapshot versioning: previous_id chain works

### Integration Tests
- [ ] Driver submits insurance → audit event created
- [ ] Admin approves insurance → eligibility recalculated + audit event
- [ ] Admin rejects insurance → eligibility recalculated + audit event
- [ ] GET `/api/compliance/eligibility/:driverId` returns correct status
- [ ] GET `/api/admin/audit/drivers/:driverId` returns complete trail
- [ ] GET `/api/admin/audit/rides/:rideId` returns complete trail

### E2E Tests
- [ ] Two-wallet staging pilot:
  1. Rider creates ride
  2. Rider deposits escrow
  3. Driver goes online (eligibility = true) → can see ride
  4. Driver accepts ride
  5. Audit trail shows: RIDE_REQUESTED → ESCROW_FUNDED → RIDE_ACCEPTED
  6. Ride starts (PIN verified)
  7. Ride completes → escrow released
  8. Audit trail complete with all events

### Compliance Tests
- [ ] Insurance rejection blocks ride acceptance
- [ ] Expired insurance (expirationDate < today) blocks ride acceptance
- [ ] Missing TNC endorsement blocks ride acceptance
- [ ] Admin cannot approve driver without insurance verification
- [ ] Driver eligibility cannot be modified directly (only via recalculation)

---

## Database Migration

Run Drizzle to create the new tables:

```bash
npm run db:push
```

This creates:
1. `audit_events` (immutable append-only)
2. `insurance_policies`
3. `driver_eligibility_snapshots`

---

## Phase 1A → 1B (Next Week)

### What to build next:
1. **Ride Acceptance Enforcement** — Block rides if `canAcceptGeneralRides = false`
2. **Ride PIN Verification** — Generate PIN before ride starts, require driver entry
3. **Incident/SOS Reporting** — Report types, admin notification, closure
4. **MCO Airport Fields** — Terminal, flight, luggage, eligibility tracking

### What to integrate with existing code:
- Modify `POST /api/rides/accept` to check eligibility
- Modify `rides` table to add `ridePin` and `pinVerifiedAt` fields
- Add PIN verification before ride transitions to RIDE_STARTED
- Create `incidents` table for SOS/incident reports
- Add airport fields to rides (terminal, flight, luggage, child seat)

---

## Critical Reminders

✅ **DO:**
- Always use eligibility snapshots for ride-gating
- Create audit events for every compliance action
- Verify insurance status before approving driver
- Block rides if any hard gate fails
- Log all admin overrides with reasoning

❌ **DON'T:**
- Let drivers self-certify insurance
- Update eligibility snapshot directly (always recalculate)
- Skip audit events for "less important" actions
- Allow drivers to go online with expired insurance
- Trust client-provided eligibility status

---

## Contact & Questions

This implementation is the **foundation for Florida TNC compliance** and safe two-wallet pilot operations.

If you need to:
- Adjust hard gates (insurance, identity, etc.)
- Change event types
- Add new eligibility fields
- Modify enforcement logic

Always preserve:
- Immutability of audit trail
- Non-negotiable hard gates
- Audit event creation for every critical action
- Version chain in eligibility snapshots

