# GitHub Copilot Instructions - Libre Ride Web3 Dapp

## Project Overview
**Libre Ride** is a Florida-compliant Web3 ride-sharing platform (MVP) targeting Orlando. Full-stack: React/Vite client, Express/TypeScript API, Drizzle/Postgres DB, Web3 wallet integration (Base network), real-time services (Redis, WebSockets), and compliance automation.

---

## Architecture & Data Flow

### Monorepo Structure
```
client/              → React SPA (Vite) - src has @/ alias
server/              → Express API + WebSocket server
shared/schema.ts     → Drizzle ORM tables + Zod types (SSoT for data models)
migrations/          → Auto-generated SQL from Drizzle
docker-compose.yml   → Local dev: Postgres, Redis, Mailhog, OneSignal mock
```

### Key Auth Flow
1. **Firebase** is primary auth (email/Google/Apple) → ID token in Authorization header
2. **Wallet** is optional, verified via SIWE signature (`walletVerifiedAt`)
3. **Roles**: rider | driver | admin (in `users.role`)
4. **Auth middleware** (`server/middleware/auth.ts`): Always extracts user from verified token, never trusts client-provided userId

### Database Layer
- **Drizzle ORM** with Postgres (Neon/Supabase/RDS/local)
- Connection pool: max 5 for Neon free tier (strict limit - do NOT increase)
- Tables in `shared/schema.ts`: users, drivers, rides, badges, waitlist, documents, etc.
- **Type safety**: Use `createInsertSchema()` from drizzle-zod to auto-generate Zod validators
- Migrations: Run `npm run db:push` to sync schema; generated migrations in `drizzle/` folder

### Web3 Integration (Base Network)
- **Wallet**: Wagmi + RainbowKit client-side
- **Account Abstraction**: ZeroDev SDK for AA wallet creation (`server/lib/aa/create-wallet.ts`)
- **Escrow**: USDC escrow contract (`contracts/RideEscrow.sol`) on Base testnet
- **Escrow flow**: Create escrow on ride → lock USDC → release on completion
- **Key env vars**: `NEXT_PUBLIC_ALCHEMY_BASE_RPC`, `USDC_CONTRACT_ADDRESS_TESTNET`, `PRIVATE_KEY_DEPLOYER`

### Real-Time & Notifications
- **WebSocket**: Native `ws` library (not Socket.io) for driver presence, ride updates
- **Email**: Resend API for onboarding, verification, receipts
- **SMS**: Twilio (SOS alerts, OTP)
- **Push**: OneSignal (ride notifications)
- **Dev mocks**: Mailhog, Twilio mock, OneSignal mock in docker-compose.yml

### WebSocket Safety Rules (Critical for Real-Time Agents)

**ALWAYS:**
- ✅ Filter WS payloads by user role (riders see rider data, drivers see driver data only)
- ✅ Validate every WS message server-side (never trust client-sent socket events)
- ✅ Require `requireAuth` before WS upgrade (verify Firebase token)
- ✅ Broadcast only after DB state change (WS is notification, not source of truth)
- ✅ Use ride ID + user ID to scope visibility (prevent cross-user leakage)
- ✅ Log all WS broadcasts for audit trail

**NEVER:**
- ❌ Broadcast entire user objects (PII leak risk)
- ❌ Trust `userId` from WS message (use token identity)
- ❌ Update DB based solely on WS event (WS confirms, doesn't cause)
- ❌ Broadcast sensitive fields (passwords, API keys, raw escrow amounts)
- ❌ Allow unauthenticated WS connections
- ❌ Broadcast duplicate events (check dedup key first)

**WebSocket Testing Checklist:**
1. Open **two browser windows** (one rider, one driver)
2. Rider: Create ride → copy ride ID
3. Driver: Accept ride
4. **DevTools → Network → WS** tab (observe events)
5. Confirm **rider sees driver location**, **driver sees rider name** (not SSN)
6. Cancel ride → observe refund event
7. **Verify no cross-user leakage** (driver shouldn't see other drivers' earnings, etc.)

**Code Locations:**
- Setup: `server/routes.ts` (WebSocketServer initialization)
- Message handlers: `ws.on('message', ...)` and `wss.on('connection', ...)`
- Payload filtering: Search for `role === 'driver'` checks before broadcast
- Auth: `server/middleware/auth.ts` (same `requireAuth` for WS upgrade)

### WebSocket Dedup Pattern (Idempotency)

Prevent duplicate events from both REST + WS paths or retry storms:

```typescript
// Canonical dedup key pattern
const dedupKey = `${eventType}:${rideId}:${state}`;

// Before emitting
if (await hasEmitted(dedupKey)) {
  console.log(`[WS] Dedup skip: ${dedupKey}`);
  return; // Already emitted
}

// Emit event
wss.broadcast({ type: eventType, rideId, state });

// Mark as emitted (store in Redis or in-memory cache, TTL ~60s)
await markEmitted(dedupKey);
```

**Example: Ride state transitions**
```typescript
// When ride transitions to 'en_route'
const dedupKey = `ride:state-change:${rideId}:en_route`;
if (!(await hasEmitted(dedupKey))) {
  wss.broadcast({ type: 'ride:state', rideId, state: 'en_route' });
  await markEmitted(dedupKey);
}
```

**Why this matters:**
- Agents often emit on both REST endpoint AND internal function
- Retries can trigger duplicate broadcasts
- Duplication confuses clients and cascades

**Guardrails:**
- ❌ NEVER skip dedup for "critical" events (all events are critical)
- ✅ ALWAYS check dedup before broadcast
- ✅ Use TTL so keys expire (prevent memory bloat)

---

## Developer Workflows

### Build & Run
```bash
npm run dev              # Start Express + Vite dev server
npm run build            # Vite builds client → dist/public; esbuild bundles server → dist/index.js
npm start                # Production: run dist/index.js
npm run check            # TypeScript check (no emit)
npm run db:push          # Sync schema to DB (Drizzle)
npm run test:db          # Run test-db-state.js script
```

### Database
```bash
npx drizzle-kit push              # Apply schema changes
npx drizzle-kit generate          # Generate migrations (manual)
npx drizzle-kit migrate           # Run migrations
```

### Docker Dev Environment
```bash
docker-compose up                 # Postgres, Redis, Mailhog, mocks, server, client
docker-compose logs -f server     # Watch server logs
```

### Testing Checklist
- **Auth**: Test both Firebase token + wallet flow; verify `req.user` is set from token, not client
- **Escrow**: Test ride creation → escrow lock → release; verify state transitions
- **Documents**: Test upload, rejection flow, re-upload
- **Compliance**: Verify driver approval gates trigger on doc completion
- **Real-time**: Use browser DevTools → Network → WS tab to inspect WebSocket payloads

---

## Code Patterns & Conventions

### Route Organization (`server/routes/`)
Each route file exports default Express router:
```typescript
export default router;  // NOT named export
```
Imported in `server/routes.ts` and mounted on app.

### API Endpoint Pattern
All endpoints return JSON with `{ success: boolean, data?: T, error?: string }`:
```typescript
app.post('/api/rides', requireAuth, async (req, res) => {
  try {
    const validated = insertRideSchema.parse(req.body);
    const ride = await db.insert(rides).values(validated).returning();
    res.json({ success: true, data: ride[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
```

### Schema Types
Never manually type DB results—always derive from Drizzle:
```typescript
// In shared/schema.ts
export const insertRideSchema = createInsertSchema(rides);
export type InsertRide = z.infer<typeof insertRideSchema>;

// In route
const validated = insertRideSchema.parse(req.body);
```

### Middleware Stacking
Guard endpoints with explicit middleware order:
```typescript
router.post('/api/rides', 
  requireAuth,              // Verify Firebase token
  requireWallet,            // Optional: verify wallet linked
  requireSIWE,              // Optional: verify SIWE signed
  validateBody(schema),     // Body validation
  handler                   // Business logic
);
```

### Error Handling
Use descriptive messages matching Zod validation:
```typescript
catch (err) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed: ' + formatZodError(err)
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}
```

### Client Hooks (`client/src/hooks/`)
Use TanStack Query for data fetching:
```typescript
const { data: rides } = useQuery({
  queryKey: ['rides'],
  queryFn: () => fetch('/api/rides').then(r => r.json()),
});
```

### Component Organization
- UI components in `components/ui/` (generated from shadcn/ui)
- Feature components in `components/` (e.g., DriverCard.tsx, UploadDocument.tsx)
- Pages in `pages/` (routed via Wouter)

### Type Imports (Critical)
Always use `type` imports for types to avoid runtime bloat:
```typescript
// ✓ Correct
import type { Ride } from '@shared/schema';

// ✗ Avoid
import { Ride } from '@shared/schema'; // May bundle runtime if re-exported
```

---

## Common Tasks & Pitfalls

### Adding a New Database Table
1. Define table in `shared/schema.ts` using Drizzle syntax
2. Add Zod schema: `export const insertXyzSchema = createInsertSchema(xyz);`
3. Run `npm run db:push`
4. Test query in route: use typed schemas (no manual `as` casts)
5. Export types: `export type InsertXyz = z.infer<typeof insertXyzSchema>;`

### Protecting an Endpoint
- **Firebase token required**: Use `requireAuth` middleware
- **Wallet linked required**: Add `requireWallet` (also runs `requireAuth`)
- **SIWE verified required**: Add `requireSIWE` (implies wallet linked)
- **Admin only**: Use `requireAdmin` (checks `req.user.role === 'admin'`)
- **NEVER** trust `userId` from request body; always use `req.user.userId` from token

### Testing Wallets Locally
- Use Viem + test accounts for contracts
- Call escrow contract via Viem `publicClient.call()` or `walletClient.sendTransaction()`
- Mock testnet USDC approvals in dev
- Use Wagmi testing utils for client-side wallet flows

### Debugging Database Queries
- Enable Drizzle query logging: Set env var `LOG_DRIZZLE=1` (if configured)
- Check `drizzle.config.ts` for migrations
- Use `npm run test:db` to validate schema state
- For connection issues: Check `DATABASE_URL`, verify Neon/Supabase credentials, check pool size

### Handling Document Uploads
- Use UploadThing (`server/uploadthing.ts`) for file storage
- Store metadata in DB (`documents` table)
- Rejection flow: Update `documentStatus` → trigger email → allow re-upload
- No OCR yet (placeholder in schema) — plan for future integration

---

## Compliance & Business Logic

### Florida TNC Requirements
Implemented gates in driver approval flow:
- Driver license verification (document upload)
- Vehicle registration + insurance (separate uploads)
- Background check (Persona integration + document upload)
- Airport license flag (`drivers.isAirportLicensed`)
- Identity verification (`users.identityVerified` via Persona)

### Compliance Gates (Enforced in Code)

**CRITICAL: Compliance gates are NOT optional. Violating these is legal/business risk.**

| Gate | Middleware | Location | Applies To | Check |
|------|-----------|----------|-----------|-------|
| **Identity Verified** | `requireIdentity` | `server/middleware/auth.ts` | Ride creation, payouts | `users.identityVerified = true` |
| **Driver Approved** | `requireDriverApproved` | `server/middleware/auth.ts` | Driver actions, ride acceptance | `drivers.driverStatus = 'approved'` |
| **Wallet Linked** | `requireWallet` | `server/middleware/auth.ts` | Escrow, payouts | `users.walletVerifiedAt NOT NULL` |
| **SIWE Signed** | `requireSIWE` | `server/middleware/auth.ts` | Escrow, admin actions | `users.siweVerifiedAt NOT NULL` + valid signature |
| **Documents Complete** | Custom in route | `server/routes/driver.ts` | Driver activation | All required docs approved |
| **Background Check** | Custom in route | `server/routes/driver.ts` | Driver approval | Persona check passed |
| **Airport License** | Optional gate | `server/routes/rides.ts` | Airport rides | `drivers.isAirportLicensed = true` |

**Enforcement Example: Ride Creation**
```typescript
router.post('/api/rides/create',
  requireAuth,              // 1. User is authenticated
  requireIdentity,          // 2. Rider identity verified
  validateBody(createRideSchema),
  handler                   // 3. Only then handle request
);
```

**Enforcement Example: Escrow Deposit**
```typescript
router.post('/api/escrow/deposit',
  requireAuth,              // 1. User is authenticated
  requireWallet,            // 2. Wallet linked + verified
  requireSIWE,              // 3. Message signed
  validateBody(escrowSchema),
  handler
);
```

### Ride Pricing
- Base fare + distance/duration
- Surge multiplier during peak times (Stored in `SURGE_TIERS` constant)
- Airport fee (`rides.airportFee`) if pickup/dropoff is MCO
- Cashback/Rewards: `rides.cashbackAmount`, `rides.libreRewards` (future)

### Escrow State Machine
```
pending → locked (funds held) → released (driver paid) | refunded (cancellation)
```
Tracked in `rides.escrowStatus` + on-chain contract state. Always verify state before transitions.

### 🔐 Escrow: Canonical Interaction Flow (DO NOT DEVIATE)

Escrow operations are **money-critical** and **multi-step** — agents must follow this exact sequence:

**Flow:**
1. Ride created (DB: escrowStatus = 'pending')
2. Rider approves deposit (frontend checks USDC balance ≥ amount)
3. Frontend submits deposit TX (Wagmi/Viem to RideEscrow contract)
4. Backend receives txHash → validates receipt (getTransactionReceipt)
5. Backend updates DB: escrowStatus = 'locked', escrowTxHash stored
6. Ride progresses: 'en_route' → 'on_trip' → 'completed'
7. Backend prepares release: validates escrowStatus = 'locked' + finalPrice ≤ escrowAmount
8. Frontend submits release TX (SIWE required)
9. Backend confirms release → updates DB: escrowStatus = 'released', escrowReleaseTxHash stored
10. Driver paid, ride archived

**CRITICAL Guardrails:**
- ❌ **NEVER** update `escrowStatus` without on-chain TX receipt verification
- ❌ **NEVER** accept `escrowStatus` from client (verify from contract state only)
- ❌ **NEVER** release if `rides.escrowStatus ≠ 'locked'`
- ❌ **NEVER** release amount > what was locked
- ❌ **NEVER** skip SIWE for escrow routes (use `requireSIWE` middleware)
- ✅ **ALWAYS** verify DB state before contract call
- ✅ **ALWAYS** sync off-chain (DB) and on-chain (contract) state
- ✅ **ALWAYS** log escrow transitions with amounts for audit

**Code Locations:**
- Routes: `server/routes/escrow.ts`
- Contract: `server/lib/aa/` (Viem client)
- Schema: `shared/schema.ts` (escrowStatus, escrowAmount, escrowTxHash fields)

**Anti-Patterns to Avoid:**
- ❌ Calling contract directly from backend (frontend must sign)
- ❌ Using event logs as sole source of truth (reconcile with DB)
- ❌ Skipping confirm endpoint (always: send txHash → verify → update DB)

### Escrow Confirmation Endpoint (Trust Boundary Pattern)

This is the critical point where **chain state** must reconcile with **DB state**:

```typescript
// POST /api/escrow/confirm
// This endpoint bridges on-chain + off-chain state

router.post('/api/escrow/confirm',
  requireAuth,
  requireSIWE,
  validateBody(confirmEscrowSchema), // { rideId, txHash }
  async (req, res) => {
    try {
      const { rideId, txHash } = req.body;
      
      // 1. VALIDATE TX EXISTS & SUCCEEDED
      const receipt = await viem.getTransactionReceipt({ hash: txHash });
      if (!receipt) return res.status(400).json({ error: 'TX not found on-chain' });
      if (receipt.status !== 'success') return res.status(400).json({ error: 'TX failed' });
      
      // 2. VALIDATE TX CALLED ESCROW CONTRACT
      if (receipt.to !== ESCROW_CONTRACT) return res.status(400).json({ error: 'Wrong contract' });
      
      // 3. VALIDATE EVENT MATCHES RIDE
      const events = parseEscrowDeposited(receipt.logs);
      const event = events.find(e => e.rideId === rideId);
      if (!event) return res.status(400).json({ error: 'Event not found for this ride' });
      
      // 4. VALIDATE DB STATE ALLOWS CONFIRMATION
      const ride = await db.query.rides.findFirst({ where: eq(rides.id, rideId) });
      if (ride.escrowStatus !== 'pending') return res.status(400).json({ error: 'Invalid state' });
      
      // 5. PERSIST: Update DB with confirmed escrow
      await db.update(rides).set({
        escrowStatus: 'locked',
        escrowTxHash: txHash,
        escrowAmount: event.amount
      }).where(eq(rides.id, rideId));
      
      // 6. BROADCAST (only after DB updated)
      wss.broadcast({ type: 'escrow:locked', rideId });
      
      res.json({ success: true, data: { escrowStatus: 'locked', txHash } });
    } catch (err) {
      console.error('Escrow confirm failed:', err);
      res.status(500).json({ error: 'Internal error' });
    }
  }
);
```

**Guardrails:**
- ❌ NEVER update DB before TX receipt validation
- ❌ NEVER accept frontend's "success" claim
- ❌ NEVER broadcast before DB persist
- ✅ ALWAYS validate event matches rideId
- ✅ ALWAYS verify current DB state before transition

---

## External Dependencies & API Keys
Check `.env.example` for full list:
- **Firebase**: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- **Web3**: `NEXT_PUBLIC_ALCHEMY_BASE_RPC`, `NEXT_PUBLIC_BASE_CHAIN_ID` (8453 mainnet, 84532 testnet)
- **Uploads**: `UPLOADTHING_API_KEY`, `UPLOADTHING_SECRET`
- **Notifications**: `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `ONESIGNAL_APP_ID`
- **Identity**: `PERSONA_API_KEY`, `PERSONA_TEMPLATE_ID`
- **Account Abstraction**: `ZERO_DEV_PROJECT_ID`

Missing keys trigger warnings/errors at startup. See logs for details.

---

## System Invariants (Critical Constraints)

These invariants must **never** be violated. If an agent change would break one of these, reject the change:

- ✅ A ride can have **only one active escrow** (no double-locking)
- ✅ Escrow can **only transition forward** (pending → locked → released, never backward)
- ✅ Escrow **cannot be released twice** (idempotency required)
- ✅ Driver payout **must be ≤ escrow amount locked** (no overpaying)
- ✅ Wallet address is **immutable once verified** (no re-linking)
- ✅ Identity verification is **one-way** (unverify only via admin)
- ✅ Driver status transitions respect **approval workflow** (unverified → pending → approved, never skip)
- ✅ User roles are **mutually exclusive per account** (rider XOR driver, unless admin)
- ✅ Compliance gates **cannot be bypassed** (all middleware must execute in order)

---

## Safe Refactor Zones (Where Agents Can Move Code)

Not all code is equally safe to refactor. Use this guide:

### ✅ Safe to refactor without review:
- UI components in `client/src/components/` (safe: isolated, no auth/data loss risk)
- Analytics events in `client/src/` (safe: non-critical path)
- Utility functions in `client/src/lib/` and `server/lib/utils/` (safe: no side effects if pure)
- Email template styling in `server/email.ts` (safe: cosmetic changes)
- Unused imports and variable names (safe: grep-able, no logic change)

### 🛑 DO NOT refactor without review + tests:
- **Auth middleware** (`server/middleware/auth.ts`) — token verification is critical
- **Escrow logic** (`server/routes/escrow.ts`) — money path, any change is risky
- **Identity verification** (`server/routes/identity.ts`) — compliance gate, legal risk
- **Compliance gates** (any `requireX` middleware) — bypass risk
- **Database schema** (`shared/schema.ts`) — migration required, data loss risk
- **WebSocket handlers** (`server/routes.ts` WS sections) — data leakage risk
- **Wallet linking** (`server/routes/wallet.ts`) — state corruption risk

### 🔍 Always pair review with:
- All changes to `server/routes/` (money/auth paths)
- All changes to `server/middleware/` (auth enforcement)
- All changes to `shared/schema.ts` (DB structure)
- Any change that modifies `req.user` or roles

---

## Quick Reference: File Locations
- Routes: `server/routes/*.ts`
- Auth middleware: `server/middleware/auth.ts`
- DB schema: `shared/schema.ts`
- DB client: `server/db/client.ts`
- Web3 wallet creation: `server/lib/aa/create-wallet.ts`
- Email templates: `server/email.ts`
- Client pages: `client/src/pages/*.tsx`
- UI components: `client/src/components/ui/`
- Config: `.env`, `package.json`, `drizzle.config.ts`, `vite.config.ts`

---

## New Contributor / AI Agent Quick Start

**Before writing code:**

1. ✅ Read these sections of this file:
   - "Key Auth Flow" & "Middleware Stacking"
   - "Escrow: Canonical Interaction Flow"
   - "Compliance Gates (Enforced in Code)"
   - "WebSocket Safety Rules"

2. ✅ Remember: **Never bypass middleware. Never trust client input for identity/state.**

3. ✅ When in doubt: "Is this money, auth, or compliance-related?" → Ask before coding.

4. ✅ Run `npm run dev` and test locally before submitting.

That's it. You're ready.
