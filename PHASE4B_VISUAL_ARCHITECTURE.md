# Phase 4B Visual Architecture & Data Flow

## Complete Driver Journey Flow

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         DRIVER PAGE (Driver.tsx)                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  ┌────────────────────────────────────────────────────────────────┐ ┃
┃  │ HOOKS LAYER (Business Logic)                                   │ ┃
┃  ├────────────────────────────────────────────────────────────────┤ ┃
┃  │                                                                │ ┃
┃  │  useRideOffers()                                             │ ┃
┃  │  ├─ WebSocket connection with auto-reconnect               │ ┃
┃  │  ├─ Listen: ride.offered, ride.withdrawn                   │ ┃
┃  │  └─ Return: { currentOffer, isLoading, error, ws }        │ ┃
┃  │                                                                │ ┃
┃  │  useDriverStatus()                                           │ ┃
┃  │  ├─ TanStack Query mutation                                 │ ┃
┃  │  ├─ POST /api/driver/status (with geolocation)           │ ┃
┃  │  └─ Return: { isOnline, setIsOnline, isLoading, error }  │ ┃
┃  │                                                                │ ┃
┃  │  useRideAcceptance(ws)                                       │ ┃
┃  │  ├─ Event listener on WebSocket                            │ ┃
┃  │  ├─ Send: ride.accept event                                │ ┃
┃  │  ├─ Listen: ride.accept_success / ride.accept_failed      │ ┃
┃  │  ├─ Timeout: 10 seconds                                    │ ┃
┃  │  └─ Return: { acceptRide, isAccepting, error, acceptedId}│ ┃
┃  │                                                                │ ┃
┃  │  useRideStart()                                              │ ┃
┃  │  ├─ POST /api/rides/:id/start (requires SIWE)            │ ┃
┃  │  ├─ Maps: 402 → escrow_required                           │ ┃
┃  │  ├─ Maps: 403 → not_authorized                            │ ┃
┃  │  ├─ Maps: 404 → not_found                                 │ ┃
┃  │  ├─ Maps: 409 → invalid_state                             │ ┃
┃  │  └─ Return: { startRide, isStarting, error, success }    │ ┃
┃  │                                                                │ ┃
┃  └────────────────────────────────────────────────────────────────┘ ┃
┃                                                                        ┃
┃  ┌────────────────────────────────────────────────────────────────┐ ┃
┃  │ STATE MANAGEMENT (Local State in Driver.tsx)                 │ ┃
┃  ├────────────────────────────────────────────────────────────────┤ ┃
┃  │                                                                │ ┃
┃  │  isOnline: boolean                                           │ ┃
┃  │  currentOffer: RideOffer | null                              │ ┃
┃  │  acceptedRide: { id, status, escrowStatus, ... } | null    │ ┃
┃  │  acceptedRideId: string | null                              │ ┃
┃  │                                                                │ ┃
┃  └────────────────────────────────────────────────────────────────┘ ┃
┃                                                                        ┃
┃  ┌────────────────────────────────────────────────────────────────┐ ┃
┃  │ COMPONENT LAYER (UI Rendering)                               │ ┃
┃  ├────────────────────────────────────────────────────────────────┤ ┃
┃  │                                                                │ ┃
┃  │  {!isOnline} ───────────────────────────────────────────────┐ ┃
┃  │  │                                                           │ ┃
┃  │  └──→ <DriverStatusToggle>                                  │ ┃
┃  │       └─ Shows: "🔴 Offline" / "🟢 Online" toggle          │ ┃
┃  │                                                              │ ┃
┃  │  {isOnline && !acceptedRide && !currentOffer}              │ ┃
┃  │  │                                                           │ ┃
┃  │  └──→ <p>"Searching for riders..."</p>                     │ ┃
┃  │                                                              │ ┃
┃  │  {isOnline && !acceptedRide && currentOffer}               │ ┃
┃  │  │                                                           │ ┃
┃  │  └──→ <DriverRideOfferCard                                  │ ┃
┃  │       offer={currentOffer}                                   │ ┃
┃  │       onAccept={handleAcceptOffer}                           │ ┃
┃  │       isAccepting={isAccepting}                              │ ┃
┃  │       error={acceptError}                                    │ ┃
┃  │       />                                                      │ ┃
┃  │                                                              │ ┃
┃  │  {acceptedRide}                                             │ ┃
┃  │  │                                                           │ ┃
┃  │  └──→ <DriverAcceptedRidePanel                              │ ┃
┃  │       rideId={acceptedRide.id}                              │ ┃
┃  │       status={acceptedRide.status}                          │ ┃
┃  │       escrowStatus={acceptedRide.escrowStatus}              │ ┃
┃  │       price={acceptedRide.price}                            │ ┃
┃  │       onStart={handleStartRide}                             │ ┃
┃  │       isStarting={isStarting}                               │ ┃
┃  │       error={startError}                                    │ ┃
┃  │       />                                                      │ ┃
┃  │                                                              │ ┃
┃  │       Inside: <StartRideButton>                             │ ┃
┃  │       ├─ Disabled if escrowStatus ≠ 'locked'               │ ┃
┃  │       ├─ Shows: "⏳ Waiting for payment"                    │ ┃
┃  │       │          or "▶ Start Ride"                          │ ┃
┃  │       └─ On click: startRide(rideId)                        │ ┃
┃  │                                                              │ ┃
┃  └────────────────────────────────────────────────────────────────┘ ┃
┃                                                                        ┃
└━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┘
```

---

## Request/Response Timeline

```
TIME    DRIVER                  WEBSOCKET              BACKEND

0:00    Click "Go Online"
        │
        ├─────────────────────→ POST /api/driver/status ──→
        │                       (isOnline: true, lat, lng)
        │                       ← 200 OK ←──────────────────
        │
        └─ isOnline = true
          (Show "Searching...")

        [WebSocket connection established]

1:00    [Waiting for rides...]

2:00                            ← ride.offered ←──────────
                                (rideId, pickup, dropoff, price)
        │
        └─ currentOffer = {...}
          (DriverRideOfferCard appears)

2:05    Click "Accept Ride"
        │
        ├──────────────────────→ ride.accept ──────────────→
        │                       (rideId)
        │                       
        │                       Backend: Atomic transaction
        │                       ├─ Lock ride row (FOR UPDATE)
        │                       ├─ Verify driver authorized
        │                       ├─ Check status = ACCEPTED
        │                       ├─ Check escrowStatus = 'locked'?
        │                       │  (Not yet, so pending)
        │                       ├─ Update DB: status = ACCEPTED
        │                       └─ Emit: ride.accept_success
        │
        │ ← ride.accept_success ←──────────────────────────
        │   (rideId)
        │
        ├─────────────────────→ GET /api/rides/{rideId} ──→
        │
        │ ← Ride details ←──────────────────────────────────
        │   { id, status, escrowStatus, pickup, dropoff, ... }
        │
        └─ acceptedRide = {...}
          acceptedRideId = rideId
          (DriverAcceptedRidePanel appears)
          (StartRideButton disabled ← escrowStatus = 'pending')

2:10                            [Rider funds escrow...]
                                [Rider: POST /api/escrow/confirm]

2:15                            ← escrow:locked ←────────────
                                (rideId)
        │
        └─ acceptedRide.escrowStatus = 'locked'
          (StartRideButton becomes ENABLED)

2:20    Click "Start Ride"
        │
        ├─────────────────────→ POST /api/rides/{id}/start ─→
        │                       (requires SIWE signature)
        │                       
        │                       Backend: Validate
        │                       ├─ requireAuth ✓
        │                       ├─ requireWallet ✓
        │                       ├─ requireSIWE ✓
        │                       ├─ Driver authorized? ✓
        │                       ├─ Status = ACCEPTED? ✓
        │                       ├─ escrowStatus = 'locked'? ✓ ← GATE
        │                       ├─ Lock ride row (FOR UPDATE)
        │                       ├─ Update: status = IN_PROGRESS
        │                       │  startedAt = now()
        │                       └─ Emit: ride.state_changed
        │
        │ ← 200 OK ←──────────────────────────────────────
        │   { success: true, data: { status: "IN_PROGRESS" } }
        │
        └─ success = true
          acceptedRide = null (cleared)
          (Navigation view shown)

2:25    [Trip in progress...]
```

---

## Component Hierarchy

```
Driver.tsx (Page)
│
├─ useRideOffers() ─────────────────────┐
├─ useDriverStatus() ──────────────────┐│
├─ useRideAcceptance(ws) ────────────┐││
└─ useRideStart() ───────────────────┐│││
                                      ││││
┌──────────────────────────────────────┤│││
│                                      ││││
│  {!isOnline}                         ││││
│  └─ <DriverStatusToggle />           ││││
│     └─ uses hook from ────────────────┼┘││
│                                        │││
│  {isOnline && !acceptedRide && !offer} │││
│  └─ "Searching for riders..."         │││
│                                        │││
│  {isOnline && !acceptedRide && offer}  │││
│  └─ <DriverRideOfferCard              │││
│     offer={currentOffer}              │││
│     onAccept={...} ───────────────────┼┤││
│     />                                │││
│                                        │││
│  {acceptedRide}                        │││
│  └─ <DriverAcceptedRidePanel          │││
│     escrowStatus={...} ────────────────┼┼──┐
│     onStart={...} ────────────────────────┼┤
│     />                                │││ │
│     │                                 │││ │
│     └─ <StartRideButton               │││ │
│        escrowStatus={...}             │││ │
│        onClick={startRide} ───────────────┘
│        disabled={...}                 │││
│        />                             │││
│                                       │││
└───────────────────────────────────────┘││
                                         ││
    All hooks provide data flow ──────────┘
```

---

## WebSocket Event Flow

```
CLIENT (Browser)                    WEBSOCKET                   SERVER (Express)
═════════════════════════════════════════════════════════════════════════════════

[Connected]
    │
    ├─────────── auth: firebase_token ────────────→
    │                                              [Verify token]
    │                                              [Store connection]
    │
    [Waiting for offers...]
    │
    │←────────── ride.offered ←────────────────────
    │            {
    │              type: 'ride.offered',
    │              rideId: '...',
    │              pickup: {...},
    │              dropoff: {...},
    │              estimatedMiles: 8.2,
    │              estimatedPrice: 24.50
    │            }
    │
    │ [Display offer to driver]
    │
    [Driver clicks Accept]
    │
    ├─────────── ride.accept ───────────────────→
    │            { rideId: '...' }
    │
    │                                              [Process acceptance]
    │                                              [FOR UPDATE lock]
    │                                              [Update DB]
    │                                              [Emit success]
    │
    │←────────── ride.accept_success ←─────────────
    │            { rideId: '...' }
    │
    │ [Fetch ride details via REST]
    │
    ├─────────── GET /api/rides/:id ────────────→
    │            [With auth header]
    │←────────── Ride details ←──────────────────
    │
    [Display accepted ride panel]

    [Waiting for payment...]
    │
    │←────────── escrow:locked ←─────────────────
    │            { rideId: '...' }
    │
    │ [Enable start button]
    │
    [Driver clicks Start]
    │
    ├─────────── POST /api/rides/:id/start ────→
    │            [With SIWE signature header]
    │
    │                                              [Verify escrow locked]
    │                                              [Return 402 if not]
    │                                              [OR: Transition state]
    │
    │←────────── 200 OK / 402 error ←────────────
    │
    [Clear accepted state / Show error]

```

---

## Error Handling Flow

```
USER ACTION              FRONTEND                  BACKEND              UI FEEDBACK
════════════════════════════════════════════════════════════════════════════════════

Go Online    ──→  setIsOnline(true)          POST /api/driver/status
             ←──  Success response           ✓ Status updated
                  OR error handling          ← Error: "Failed to go online"
                                             [Display: Error message 5s]

Accept Ride  ──→  acceptRide(rideId)         WS: ride.accept
             ←──  ride.accept_success        ✓ Fetch ride details
                  OR ride.accept_failed      ← Error: "Ride unavailable"
                  OR timeout 10s             ← Error: "Network timeout"
                                             [Button re-enabled, keep offer]

Fetch Details ─→  GET /api/rides/:id        [Ride not found?]
             ←──  Ride JSON                  ← Error 404
                  OR error                   [Error: "Ride details unavailable"]
                                             [Keep offer, allow retry]

Start Ride   ──→  startRide(rideId)          POST /api/rides/:id/start
                  [SIWE required]            
             ←──  200 OK                     ✓ Clear acceptedRide state
                  OR 402                     ← "ESCROW_REQUIRED"
                  OR 403                     ← "NOT_AUTHORIZED"
                  OR 404                     ← "NOT_FOUND"
                  OR 409                     ← "INVALID_STATE"
                  OR 500                     ← "SERVER_ERROR"
                                             [Display: Error message]
                                             [Keep panel, allow retry]

WebSocket Drop     Auto-reconnect 3s        [Connection lost]
                                            ← "Network error - reconnecting"
             ←──  Reconnected               ✓ Resume listening
                  OR timeout 30s            ← "Could not reconnect"
                                            [Manual reconnect button]
```

---

## Escrow Gate Enforcement

```
                              Driver starts ride
                                      │
                                      ↓
                    POST /api/rides/:id/start
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                ✓ Valid            ✗ Escrow           ✗ Other error
               State              Not Locked         (auth, not found, etc)
                    │                 │                 │
                    ↓                 ↓                 ↓
        escrowStatus         escrowStatus = ?    status 403/404/409/500
        = 'locked'?          ≠ 'locked'               │
            │                    │                    │
            │                    │ Return: 402        │ Return: error code
            │                    │ PAYMENT_REQUIRED   │
            │                    │                    │
            ↓                    ↓                    ↓
        ✓ Transition         Frontend displays:   Frontend displays:
         to IN_PROGRESS      "⚠️ Payment not      "⚠️ You are not..."
                             received yet"       or "Ride not found"
             │                   │                    │
             ↓                   ↓                    ↓
        Ride active         Button disabled       Button disabled
        Trip proceeds       Waiting for payment   Manual retry needed
        ✓ ECONOMICALLY      Escrow gate works!    Graceful error
          SOUND             ✓ NO PAYMENT          handling
                              BYPASS!
```

---

## Summary: Everything Integrated

✅ **4 Hooks**
- useRideOffers (WS listener)
- useDriverStatus (REST mutation)
- useRideAcceptance (WS event)
- useRideStart (REST POST)

✅ **4 Components**
- DriverStatusToggle
- DriverRideOfferCard
- DriverAcceptedRidePanel
- StartRideButton

✅ **1 Page**
- Driver.tsx (fully integrated with all hooks + components)

✅ **Backend Enforcement**
- Escrow gate (402 if not locked)
- Authorization check (403 if wrong driver)
- State validation (409 if invalid)
- Database locks (FOR UPDATE)

✅ **Real-Time Updates**
- WebSocket for offers
- WebSocket for acceptance
- WebSocket for escrow status changes

✅ **Error Handling**
- All HTTP codes mapped to user messages
- WebSocket timeouts (10s for accept, 3s reconnect)
- Graceful degradation on network errors

**Phase 4B Complete: Economically-sound driver marketplace with escrow enforcement.**
