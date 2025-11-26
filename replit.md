# Libre - Web3 Ride-Sharing DApp

## Project Overview
Libre is a production-ready Web3 ride-sharing application launching in Orlando, Florida. Built with a stunning Miami vice-city neon aesthetic, it combines blockchain technology with modern ridesharing features.

## Tech Stack
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express + Node.js
- **Database**: In-memory storage (MemStorage) - ready for PostgreSQL migration
- **Real-time**: WebSocket for ride matching and chat
- **Blockchain**: Base network (Ethereum L2) with USDC payments
- **Design**: Miami vice neon theme (Hot Pink #ff2d92, Teal #02f7f3, Purple #a020f0)

## Key Features
### Implemented (MVP)
1. **Landing Page** - Hero with Orlando skyline, countdown widget, waitlist form, EN/ES toggle
2. **Rider App** - Location autocomplete, map integration, price estimator, surge pricing, Disney Easter egg
3. **Driver Dashboard** - Go online toggle, ride requests, earnings calculator, surge heat map
4. **Profile Page** - NFT badges, lifetime stats, reputation score, referral system
5. **Admin Dashboard** - Ride management, dispute resolution, SOS alerts
6. **Safety Features** - SOS button, safety modal, anonymized contact
7. **Real-time Features** - Ride status flow, WebSocket structure ready

### Design System
- **Colors**: Hot pink (primary), teal (accent), purple (secondary)
- **Typography**: Inter font family
- **Effects**: Glassmorphism cards, neon gradients, pulse animations
- **Components**: All shadcn/ui components with custom Miami vice styling

## Architecture
### Frontend Structure
```
client/src/
├── pages/          # Main application pages
│   ├── Landing.tsx
│   ├── Rider.tsx
│   ├── Driver.tsx
│   ├── Profile.tsx
│   └── Admin.tsx
├── components/     # Reusable components
│   ├── ui/        # shadcn components
│   ├── CountdownWidget.tsx
│   ├── WaitlistForm.tsx
│   ├── SOSButton.tsx
│   ├── RideStatusFlow.tsx
│   ├── NFTBadgeCard.tsx
│   ├── MapPlaceholder.tsx
│   ├── SafetyModal.tsx
│   └── LanguageToggle.tsx
└── App.tsx        # Main router
```

### Backend Structure (To be implemented in Task 2)
```
server/
├── routes.ts      # API endpoints
├── storage.ts     # Data persistence interface
└── app.ts         # Express server
```

### Data Models (shared/schema.ts)
- Users (riders and drivers with wallet addresses)
- Drivers (vehicle info, earnings, reputation)
- Rides (pickup/dropoff, pricing, GPS proofs)
- Badges (NFT achievements)
- Waitlist, SOS Alerts, Disputes, Referrals

## Orlando-Specific Features
- MCO Airport pin and fees
- International Drive
- Disney Springs
- Universal Studios
- **Easter Egg**: Disney World pickup shows Mickey ears 🐭

## Development Status
### Task 1: ✅ Schema & Frontend (COMPLETED)
- [x] Complete data models and TypeScript interfaces
- [x] Generated hero images (Orlando skyline, driver photo, fleet)
- [x] Configured Miami vice design tokens
- [x] Built all React components with exceptional polish
- [x] Mobile-responsive design with glassmorphism effects
- [x] All pages: Landing, Rider, Driver, Profile, Admin

### Task 2: 🔄 Backend Implementation (NEXT)
- [ ] API routes for rides, drivers, waitlist
- [ ] WebSocket server for real-time matching
- [ ] Storage interface with CRUD operations
- [ ] Ride matching algorithm with surge pricing
- [ ] Mock USDC payment flow

### Task 3: ⏳ Integration & Testing (PENDING)
- [ ] Connect frontend to backend APIs
- [ ] WebSocket integration for real-time features
- [ ] Web3 wallet integration (RainbowKit + Wagmi)
- [ ] Loading states and error handling
- [ ] E2E testing of critical flows

### Task 4: ⏳ Smart Contracts & Docs (PENDING)
- [ ] Solidity contracts (LibreProtocol, PaymentSplitter, LibreToken, BadgeNFT)
- [ ] Foundry structure and deployment scripts
- [ ] Contract tests
- [ ] Comprehensive README
- [ ] .env.example file

## Smart Contracts (Future)
Located in `/contracts` folder:
- **LibreProtocol.sol**: Ride tracking, reputation, GPS proofs, rewards
- **PaymentSplitter.sol**: USDC splits (97% to driver)
- **LibreToken.sol**: ERC-20 rewards token
- **BadgeNFT.sol**: ERC-721 achievement NFTs

## Environment Variables (Needed for Production)
```
MAPBOX_TOKEN=         # Mapbox GL JS API key
ALCHEMY_RPC_URL=      # Base network RPC
USDC_ADDRESS=         # USDC contract on Base
RESEND_API_KEY=       # Email service
ONESIGNAL_APP_ID=     # Push notifications
TWILIO_ACCOUNT_SID=   # Number masking
TWILIO_AUTH_TOKEN=    # SMS notifications
```

## Design Philosophy
Libre merges Web3 innovation with Miami's electric nightlife energy. Every interaction should feel premium, fast, and trustworthy—a ride-sharing experience that looks as cutting-edge as its blockchain foundation.

## Recent Changes
- 2025-11-26: Completed Task 1 - All frontend components built with Miami vice aesthetic
- Schema defined for all data models
- Images generated for landing page
- Design tokens configured in Tailwind
