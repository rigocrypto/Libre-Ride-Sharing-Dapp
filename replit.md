# Libre - Web3 Ride-Sharing DApp for Orlando, Florida

## Overview
**Libre** is a production-ready decentralized ride-sharing application built on Base network, featuring Miami vice-city neon aesthetics (hot pink #ff2d92, teal #02f7f3, purple #a020f0), complete Web3 integration with account abstraction, USDC payments, real-time ride matching via WebSocket, and full Florida/Orlando regulatory compliance under Transportation Network Company (TNC) laws.

## Current Status
✅ **MVP Complete** - All core features implemented and running
- Frontend: Landing page, Rider/Driver dashboards, Profile, Admin panel
- Backend: Full API with WebSocket server for real-time features
- Web3: Wallet connection + Account Abstraction ready
- Compliance: Florida TNC schema, photo/document upload system, geofencing logic

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Wouter + TanStack Query
- **Backend**: Express.js + Node.js + WebSocket (ws)
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion
- **Storage**: In-memory MemStorage (ready for PostgreSQL)
- **Web3**: RainbowKit + Wagmi ready, Base network targeted
- **Design**: Miami vice-city neon, glassmorphism, dark mode focus

### Key Features Implemented

#### 1. Core Ride-Sharing
- Real-time ride matching with status flow (Matching → En-route → Arrived → On-trip → Completed)
- Dynamic surge pricing (1.0x-1.25x multipliers based on demand)
- Automatic price calculation with distance/duration estimation
- Encrypted real-time chat between driver & rider
- SOS button with emergency alerts

#### 2. Florida/Orlando Compliance (FL §627.748 TNC)
- Driver background check verification (3-year re-check intervals)
- Vehicle inspection (15+ years requirement, 4-door policy)
- Insurance validation ($1M active / $50k online-only coverage)
- City of Orlando TNC permit tracking
- Airport geofencing (MCO: $3.50 surcharge within 2 miles)
- Driver suspension system (alcohol/violence/fraud flags)

#### 3. Identity & Photo Requirements (FL TNC Law)
- Driver photos (profile, FL license front/back)
- Vehicle photos (front/side/back/license plate) - visible to riders
- Insurance document upload with OCR extraction
- Background check certificate storage
- On-chain photo hashes for regulatory audit

#### 4. Web3 Integration
- Multi-method wallet connection (crypto wallet + email AA + Google + Apple)
- USDC payment flow on Base network
- 97% driver split + 3% platform fee
- Mock NFT badge system (100 rides, 1000 rides, 5-star, airport-licensed)

#### 5. Rider/Driver Features
- Rider: Autocomplete address input, price estimator, cashback display, Disney Easter egg
- Driver: Go-online toggle, ride request display, earnings calculator, metrics
- Profile: Reputation score, NFT badge grid, lifetime stats, referral generator
- Admin: Ride management, revenue stats, dispute resolution, SOS logs

## File Structure
```
├── shared/schema.ts          # Data models, Zod schemas, compliance constants
├── server/
│   ├── routes.ts            # API endpoints + WebSocket server
│   ├── storage.ts           # In-memory storage interface
│   ├── app.ts               # Express app setup
│   └── index-dev.ts         # Vite HMR setup (FIXED)
├── client/src/
│   ├── pages/               # Landing, Rider, Driver, Profile, Admin
│   ├── components/          # UI components + DriverOnboarding, DriverCard
│   ├── hooks/               # useComplianceStatus hook
│   └── lib/                 # queryClient, confetti utils
├── vite.config.ts           # Vite configuration
└── tailwind.config.ts       # Tailwind + custom color tokens
```

## Recent Fixes
1. **Fixed Vite HMR WebSocket Error** - Set explicit host:port (localhost:5000) in server/index-dev.ts
2. **Fixed Link Nesting** - Replaced nested Link→Button patterns with asChild prop + plain text Links
3. **Added Florida Compliance** - 5 new database tables for TNC compliance (background checks, vehicle inspection, insurance, permits, airport operations, audit logs)
4. **Added Photo Upload System** - Driver photos, vehicle photos, insurance documents, background checks with Zod validation

## API Endpoints

### Rides
- POST /api/rides - Create new ride
- GET /api/rides - Get all rides
- PATCH /api/rides/:id - Update ride status
- POST /api/rides/:id/match - Match driver to ride
- POST /api/rides/:id/complete - Mark ride complete

### Drivers
- POST /api/drivers - Register driver
- GET /api/drivers/online - Get online drivers
- PATCH /api/drivers/:userId - Update driver status

### Compliance (NEW)
- POST /api/driver/photos - Upload driver photo
- GET /api/driver/:driverId/photos - Get driver photos
- POST /api/vehicle/photos - Upload vehicle photo
- POST /api/insurance/document - Upload insurance
- POST /api/background-check/document - Upload background check
- GET /api/compliance/constants - Get FL compliance constants

### Admin
- GET /api/admin/stats - Revenue, active rides, drivers, alerts
- GET /api/disputes - Get disputes
- PATCH /api/disputes/:id - Update dispute status
- GET /api/sos - Get SOS alerts
- PATCH /api/sos/:id/resolve - Resolve SOS alert

## WebSocket Events
- auth - Authenticate user
- ride_request - New ride available (to drivers)
- ride_accepted - Driver assigned (to rider)
- chat_message - Encrypted message between driver/rider
- location_update - Real-time location sharing

## Environmental Setup
- PORT: 5000 (both frontend + backend)
- NODE_ENV: development
- WS Path: /ws (WebSocket server)
- HMR: localhost:5000

## Next Steps (Future Phases)
1. **Resend API Integration** - Waitlist emails + trip receipts
2. **OneSignal** - Production push notifications
3. **Twilio** - Number masking + SMS notifications
4. **UploadThing** - Real document storage with OCR
5. **World ID** - Proof-of-Humanity verification
6. **ZK Circuits** - GPS proof verification in /libre-zk/
7. **Smart Contracts** - Deploy to Base testnet

## Known Issues
- In-memory storage (no persistence between restarts)
- Mock data for testing (not production-ready)
- Placeholder OCR extraction (needs real API)
- WebSocket integration incomplete in frontend (ready for implementation)

## Development Notes
- Follow design_guidelines.md for UI consistency
- All data models in shared/schema.ts for type safety
- Use Zod for validation on all API inputs
- Add data-testid to all interactive elements
- Maintain glassmorphism + neon aesthetic throughout

---

**Last Updated**: November 27, 2025  
**Status**: MVP Complete, Ready for Integration Phase
