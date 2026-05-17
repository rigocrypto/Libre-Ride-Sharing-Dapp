# Phase 3: WebSocket Real-Time Signaling — Testing Guide

## ✅ What You Built

**Phase 3 complete:** Real-time ride offer/acceptance flow over WebSockets.

### Code Files Created
- `server/ws/auth.ts` - Firebase token verification for WS connections
- `server/ws/dedup.ts` - Dedup pattern (prevent broadcast storms)
- `server/ws/broadcast.ts` - Server→client signaling (ride.offered, ride.accepted, ride.withdrawn)
- `server/ws/handlers.ts` - Client→server handlers (ride.accept intent)
- `server/ws/index.ts` - Module exports
- Updated `server/routes.ts` - WS upgrade handler + integration

### Critical Design Points
✅ **WS is signaling only** — zero business logic, zero DB writes  
✅ **REST+Service remain authoritative** — DB is single source of truth  
✅ **Dedup prevents storms** — emitOnce pattern with TTL  
✅ **Firebase auth required** — socket.user verified server-side  
✅ **Atomic acceptance** — same `acceptRideAtomic()` transaction (Phase 1)

---

## 🧪 Phase 3 Test Checklist

### Test Setup

**Prerequisites:**
- Server running: `npm run dev`
- PostgreSQL/Neon database (from Phase 1)
- Two browser windows (or two machines)
- User A: Rider, User B: Driver

### Test Flow

#### Step 1: Verify WS Connection Works
```bash
# In browser console (rider window)
const ws = new WebSocket('ws://localhost:5000/ws?token=<firebase-id-token>');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

Expected: `Connected!` message appears, WebSocket shows blue dot in DevTools.

#### Step 2: Rider Creates Ride
```bash
# REST endpoint (POST /api/rides/create)
# Body: pickup, dropoff, etc.
# Should return: { rideId, status: 'REQUESTED', ... }
```

#### Step 3: Ride Transitions to OFFERED
Manually update DB or trigger via REST:
```sql
UPDATE rides SET status = 'OFFERED' WHERE id = '<rideId>';
```

(In production, REST endpoint will do this.)

#### Step 4: Driver Comes Online
```bash
# REST endpoint (POST /api/driver/status)
POST /api/driver/status
{
  "isOnline": true,
  "lat": 28.5,
  "lng": -81.4
}
# Response: { success: true, data: { driverId, isOnline, lat, lng } }
```

**Expected in driver WS window:** 
```json
{
  "type": "ride.offered",
  "rideId": "...",
  "pickup": { "lat": ..., "lng": ... },
  "dropoff": { "lat": ..., "lng": ... },
  "estimatedMiles": 5.2,
  "estimatedPrice": 12.50
}
```

#### Step 5: Driver Accepts (WS Event)
```bash
# In driver WS window, send:
ws.send(JSON.stringify({
  "type": "ride.accept",
  "rideId": "<rideId>"
}));
```

**Expected responses:**

**Driver window:**
```json
{
  "type": "ride.accept_success",
  "rideId": "...",
  "acceptedAt": "2025-01-09T..."
}
```

**Rider window:**
```json
{
  "type": "ride.accepted",
  "rideId": "...",
  "driverId": "..."
}
```

**Other drivers (online):**
```json
{
  "type": "ride.withdrawn",
  "rideId": "..."
}
```

#### Step 6: Verify DB State
```sql
SELECT id, status, driverId, acceptedAt
FROM rides
WHERE id = '<rideId>';

-- Expected: status = 'ACCEPTED', driverId set, acceptedAt = now()
```

#### Step 7: Test Concurrent Acceptance (Race Condition Test)
Open a 3rd browser window (Driver B):

```bash
# Both drivers (window 2 & 3) send at same time:
ws.send(JSON.stringify({ "type": "ride.accept", "rideId": "..." }));
```

**Expected:**
- **One driver** gets `ride.accept_success` (status 200)
- **Other driver** gets `ride.accept_failed` (status 409): "Another driver already accepted"
- Both receive `ride.withdrawn` (within TTL window, no duplicates)

#### Step 8: Verify Dedup (No Duplicate Broadcasts)
Check browser console for duplicate `ride.accepted` events:

```javascript
// In browser console
let eventCount = {};
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  const key = `${msg.type}:${msg.rideId}`;
  eventCount[key] = (eventCount[key] || 0) + 1;
};

// After test, log counts
console.table(eventCount);
// Expected: All values are 1 (no duplicates)
```

---

## 🔍 Debugging Checklist

### If WS doesn't connect:
- ✅ Check token is valid (not expired)
- ✅ Verify Firebase credentials in `.env`
- ✅ Check server logs: `[WS Upgrade] error`
- ✅ Inspect DevTools → Network → WS tab

### If ride.offered not received:
- ✅ Confirm driver is online in DB: `SELECT * FROM driverStatus WHERE isOnline = true;`
- ✅ Confirm ride status = 'OFFERED' in DB
- ✅ Check server logs: `[WS Broadcast] Offering ride...`
- ✅ Verify driver is within 10-mile radius

### If ride.accept_failed (409) occurs unexpectedly:
- ✅ Check DB: ride already has driverId (another driver beat you)
- ✅ Verify ride status in DB before accept
- ✅ This is correct behavior — race condition was prevented by FOR UPDATE lock

### If duplicate ride.accepted received:
- ✅ Check dedup TTL: should expire after 60 seconds
- ✅ Verify `emitOnce()` is called in handlers.ts
- ✅ Check server logs: `[WS Dedup] Skip` messages

---

## 📊 Expected Behavior Summary

| Scenario | Expected Result |
|----------|-----------------|
| 1 driver accepts | `ride.accept_success`, rider gets `ride.accepted`, others get `ride.withdrawn` |
| 2 drivers accept simultaneously | 1 succeeds (200), 1 fails (409, "already accepted"), both get `ride.withdrawn` once |
| Driver refreshes mid-accept | Dedup prevents duplicate broadcasts |
| Driver comes online after offer sent | Doesn't receive old offer (WS is live only) |
| Multiple riders watching same driver | Each gets independent WS messages (role-filtered) |

---

## ✅ Exit Criteria (All Must Pass)

- ✅ WS connection authenticates with Firebase token
- ✅ `ride.offered` broadcasts to nearby online drivers
- ✅ `ride.accept` intent handled, delegates to atomic transaction
- ✅ `ride.accepted` broadcast deduped (single event, no storm)
- ✅ `ride.withdrawn` broadcast deduped
- ✅ Concurrent acceptance race condition prevented (1 wins, 1 gets 409)
- ✅ DB state consistent after all broadcasts (status, driverId, acceptedAt)
- ✅ No TypeScript errors

---

## 🚀 Next Steps

When all tests pass, you're ready for **Phase 4: Frontend Integration**

### Phase 4 Scope
- Driver "Go Online" toggle (REST + WS status sync)
- Driver "Accept" button → WS event
- Rider "Finding driver…" → "Driver assigned" UI
- Location tracking (optional V2)

**Estimated time:** 2-3 hours

**OR** proceed directly to **Escrow Integration** if you want to tie acceptance to funding first.

---

## Command Reference

```bash
# Start server (with WS enabled)
npm run dev

# Check TypeScript
npm run check

# Query ride status
sqlite3 test.db "SELECT id, status, driverId, acceptedAt FROM rides LIMIT 1;"

# Monitor server logs
npm run dev 2>&1 | grep WS

# Test WS in browser console
ws.send(JSON.stringify({ type: 'ride.accept', rideId: '...' }))
```

---

## Notes

- ✅ WS auth happens once at upgrade (not per-message)
- ✅ Dedup uses in-memory Set (fine for MVP; Redis recommended for production >100 concurrent)
- ✅ Heartbeat (ping/pong) auto-detects dead connections every 30s
- ✅ All broadcasts role-filtered (drivers only see driver-relevant events)

Good luck! 🎉
