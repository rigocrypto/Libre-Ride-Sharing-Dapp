# LIBRE Ride - Orlando-First Web3 Ride-Sharing Platform

**LIBRE Ride** is an Orlando-first, Florida-compliance-aware Web3 ride-sharing platform designed to give drivers, riders, and local transportation operators a more transparent alternative to traditional ride-hailing apps.

LIBRE combines modern ride-sharing infrastructure with **AI dispatch concepts**, **USDC escrow**, Web3 wallet support, driver verification, compliance workflows, safety tooling, and real-time operations.

The project is currently a **QA/staging-ready MVP**, not a live production service for real passengers, real drivers, or real funds.

## Vision

Traditional ride-sharing platforms often leave drivers with limited transparency, high platform dependency, unclear earnings logic, and little ownership in the ecosystem.

LIBRE is being built around a different idea:

> Drivers should have more transparency, riders should have safer local options, and payments should be protected by modern digital infrastructure.

LIBRE is not simply "Uber with crypto." It is a **compliance-first, AI-assisted, Web3-enabled mobility marketplace** built initially for the Orlando, Florida market.

## Why Orlando?

Orlando is a strong pilot market for a next-generation ride-sharing platform because it has:

- Heavy tourism demand
- Orlando International Airport traffic
- Disney, Universal, hotels, conventions, and event zones
- High driver activity
- Strong demand for airport, tourist, family, and local transportation
- A clear need for transparent driver-first alternatives

The first launch strategy focuses on a limited Orlando pilot before broader Florida or national expansion.

## Who LIBRE Is For

**Drivers**

LIBRE is designed for independent drivers who want transparent ride offers, clear payout information, escrow-protected payment flow, verification badges, AI demand guidance, local support, founding-driver benefits, optional Web3 rewards, and a stronger voice in the platform's future.

**Riders**

LIBRE is designed for riders who want transparent fares, verified local drivers, safer ride workflows, digital payment options, tourist-friendly ride support, and better visibility into ride/payment status.

**Investors and Partners**

LIBRE is designed for early backers, local sponsors, operators, and strategic partners interested in Web3 mobility infrastructure, stablecoin payments, AI-assisted local transportation, driver-first marketplaces, Orlando tourism and airport mobility, and compliance-focused ride-sharing innovation.

## Product Snapshot

LIBRE includes or is being built toward:

- Rider and driver dashboards
- Premium LIBRE Driver Dashboard
- Ride request, offer, acceptance, and start flows
- Real-time ride state updates
- WebSocket and polling fallback
- USDC escrow flow on Base Sepolia
- Wallet support through Wagmi, RainbowKit, and Viem
- Shared escrow state machine
- AI dispatch and smart matching roadmap
- Driver document upload and compliance review
- Orlando permit and airport-eligibility workflow
- Founding Access landing page with persistent lead capture and CRM scoring
- Safety/SOS structures
- Dispute center planning
- Driver and rider subscription models
- Admin command center roadmap
- Security hardening and production readiness documentation

## Current Status

The project is currently in **QA/staging-ready MVP** state.

Verified recently:

```powershell
npm.cmd run check
npm.cmd test -- --run
npm.cmd run build
npm.cmd run test:e2e
```

Current progress:

- React/Vite/TypeScript frontend is working.
- Express/TypeScript backend is working.
- Driver dashboard is implemented.
- Escrow state machine is implemented and tested under `shared/escrow`.
- Base Sepolia `RideEscrow` contract is deployed.
- Mock USDC is deployed and funded for testing.
- Live approve -> deposit -> backend verify -> release flow has passed on Base Sepolia.
- Correct 300 bps fee split has been verified on-chain.
- Escrow balance returned to zero after release.
- Dev seed routes are isolated from production route registration.
- Security hardening reduced local audit results to low-only issues.
- Production roadmap and implementation tickets are documented.
- `/founding-access` captures founding driver and investor/partner interest with consent, source/referral tracking, lead scoring, CSV export, and an admin Lead CRM tab.

Not production-live yet:

- Basescan source verification still needs a valid API key.
- Production database validation is still needed.
- Production Firebase/KYC/storage/notification keys must be validated.
- Admin workflows need production-grade completion.
- Legal/compliance review is required before public operation.
- Smart contract and payment security review are required before handling real user funds.

## Web3 Payments & Escrow

LIBRE is designed around a payment-first ride flow.

The current tested rail is USDC escrow on Base Sepolia:

1. Rider requests a ride.
2. Rider approves USDC spend.
3. Rider deposits fare into the escrow contract.
4. Backend verifies chain ID, contract, token, amount, rider, ride ID, and transaction status.
5. Ride becomes driver-eligible only after escrow confirmation.
6. Ride is completed.
7. Funds are released to the driver, with the configured platform fee split.
8. Refunds or disputes can follow a defined workflow.

This helps reduce uncertainty for both riders and drivers. The live test for `TICKET-024` verified a 25 USDC fare, 0.75 USDC platform fee, 24.25 USDC driver payout, and final escrow balance of 0 USDC.

Important: Any token, reward, bond, staking, investment, or revenue-sharing structure connected to LIBRE requires legal review before public launch. LIBRE tokens, if introduced, should be treated as utility/reward infrastructure only unless properly reviewed under applicable securities and financial regulations.

## Why LIBRE?

**For drivers:** clearer ride economics, payment-confirmed work, compliance credentials, local launch focus, and a path toward driver-first benefits.

**For riders:** transparent fares, verified drivers, safer payment state, better local context, and tourist-friendly Orlando ride workflows.

**For local operators:** compliance-first tooling, admin visibility, airport/permit readiness, and a marketplace that can be piloted city by city.

## AI Capabilities Roadmap

LIBRE is being designed with AI features that support real operational needs:

- AI driver matching
- AI dispatch optimization
- AI demand heatmaps
- AI driver copilot
- AI document pre-screening
- AI risk scoring
- AI fraud detection
- AI tourist ride assistant
- AI toll-aware routing
- AI earnings insights

Example use cases include recommending the best driver based on compliance, distance, rating, vehicle type, and escrow readiness; helping drivers identify high-demand Orlando zones; flagging suspicious payment patterns; and helping tourists request rides to MCO, Disney, Universal, hotels, and convention areas.

## Compliance-First Orlando Launch

LIBRE is being designed with Florida and Orlando transportation requirements in mind.

Compliance areas include:

- Driver license verification
- Vehicle document upload
- Insurance document tracking
- Background-check workflow
- Orlando transportation permit tracking
- Airport/MCO eligibility workflow
- Vehicle inspection status
- Driver approval and suspension workflow
- Admin compliance queue
- Retention and privacy policies

The project includes planning for Florida TNC insurance considerations, including Florida Statutes Section 627.748, Orlando driver requirements, airport pickup eligibility, toll-aware route planning, ADA/accessibility considerations, and driver/rider safety workflows.

## Driver Founding Program

LIBRE is exploring a founding-driver model for early Orlando drivers.

Possible benefits may include:

- Founding Driver badge
- Early access to the platform
- Priority onboarding
- Reduced platform fees during pilot
- Access to private feedback group
- Driver profile visibility
- Referral rewards
- Early access to future driver benefits
- Eligibility for reputation credentials

The founding-driver program should not be treated as an investment product. It is intended as an early-access and community-building program.

## Investor / Partner Snapshot

LIBRE's early opportunity is based on:

- Orlando's high-volume tourism market
- Airport and event transportation demand
- Driver dissatisfaction with legacy platforms
- Growth in stablecoin payment infrastructure
- AI-assisted dispatch and operations
- Compliance-first transportation tooling
- Potential expansion across Florida markets

Potential revenue channels include ride platform fees, driver subscriptions, rider memberships, corporate accounts, tourist passes, local sponsor partnerships, premium driver tools, compliance/admin services, and future utility/rewards ecosystem.

Any formal investment offering should be conducted through proper legal structures, disclosures, and regulatory review.

## Stack Overview

| Layer | Technology |
| --- | --- |
| Client | React 18, Vite, TypeScript, TanStack Query, Tailwind, Radix UI |
| Server | Express, TypeScript, Zod validation |
| Persistence | Drizzle ORM, PostgreSQL, MemStorage for dev/test |
| Web3 | Wagmi, RainbowKit, Viem, Base Sepolia, USDC escrow flow, Foundry contracts |
| Realtime | WebSocket layer, polling fallback |
| Uploads | UploadThing / S3-style document storage path |
| Notifications | Resend, Twilio, OneSignal planning |
| Testing | Vitest, Playwright, Foundry |
| DevOps | Docker Compose planning, GitHub Actions CI planning |

## Architecture

```txt
client/
  React SPA
  Rider dashboard
  Driver dashboard
  Wallet/payment UI
  Compliance components

server/
  Express API
  Ride routes
  Escrow routes
  Compliance routes
  Auth scaffolding
  WebSocket/realtime layer
  routes.dev.ts

contracts/
  RideEscrow.sol
  MockUSDC.sol
  script/
  test/

shared/
  schema.ts
  escrow/
    states.ts
    transitions.ts
    validators.ts
    errors.ts
    abi.ts

docs/
  IMPLEMENTATION_TICKETS.md
  PRODUCTION_READINESS_CHECKLIST.md
  ESCROW_STATE_MACHINE.md
  DRIVER_SUBSCRIPTION_BENEFITS.md
  RIDER_SUBSCRIPTION_TIERS.md

migrations/
  SQL migrations

SECURITY.md
ORLANDO_AI_COMPLIANCE_ROADMAP.md
```

## Key Capabilities

**Rider Flow**

- Request ride
- View active ride
- Connect wallet
- Approve and deposit USDC
- Track escrow/deposit status
- Track driver assignment
- Complete ride
- View ride summary

**Driver Flow**

- Go online/offline
- View eligible ride offers
- Accept rides
- View escrow-confirmed status
- Start escrow-confirmed rides
- Track earnings
- View AI Copilot tips
- Manage vehicle/compliance status
- Access driver benefits

**Escrow Flow**

- Initiate deposit
- Check allowance
- Approve USDC spend
- Confirm deposit
- Verify transaction
- Lock ride payment
- Release payment
- Refund payment
- Dispute payment
- Maintain canonical escrow state transitions

**Admin/Compliance Flow**

- Review driver documents
- Approve/reject drivers
- Track insurance and permits
- Monitor escrow status
- Review disputes
- Manage safety flags
- Prepare for Orlando pilot operations

## Prerequisites

Recommended:

- Node.js 20+
- npm 10+
- PostgreSQL or Neon for production-like runs
- Redis if using realtime/queue features
- Docker + Docker Compose v2, optional
- Foundry for contract tests and deployment
- Base Sepolia RPC provider
- UploadThing or equivalent file storage
- Resend/Twilio/OneSignal sandbox credentials, optional

## Environment Variables

Create a local `.env` file and use development/sandbox keys. Never commit real production secrets.

Common environment groups:

```txt
Database / Storage
DATABASE_URL=
STORAGE_ENGINE=mem
REDIS_URL=

Web3 / Escrow
CHAIN_ID=84532
VITE_CHAIN_ID=84532
RPC_URL_BASE_SEPOLIA=
BASESCAN_API_KEY=
PLATFORM_WALLET_ADDRESS=
ARBITER_ADDRESS=
DEPLOYER_PRIVATE_KEY=
ESCROW_CONTRACT_ADDRESS=
VITE_ESCROW_CONTRACT_ADDRESS=
USDC_TOKEN_ADDRESS=
USDC_CONTRACT_ADDRESS_TESTNET=
VITE_USDC_TOKEN_ADDRESS=
ESCROW_VERIFIER_MODE=viem
PLATFORM_FEE_BPS=300

Auth / KYC
FIREBASE_*
PERSONA_*

Uploads
UPLOADTHING_API_KEY=
UPLOADTHING_SECRET=

Notifications
RESEND_API_KEY=
TWILIO_*
ONESIGNAL_*

Feature Flags
ENABLE_PAYMENTS=
ENABLE_AA=
ENABLE_PUSH=

Compliance
RETENTION_DAYS=
PROTOCOL_FEE_BPS=
```

## Getting Started

Install dependencies:

```powershell
npm.cmd install
```

Run TypeScript check:

```powershell
npm.cmd run check
```

Run tests:

```powershell
npm.cmd test -- --run
```

Run production build:

```powershell
npm.cmd run build
```

Run E2E smoke test:

```powershell
npm.cmd run test:e2e
```

## Development

Start local dev server:

```powershell
npm.cmd run dev
```

Depending on your local setup, the app generally runs on:

```txt
Client/API dev server: http://localhost:5000
```

Use `STORAGE_ENGINE=mem` for local development and tests when you do not want PostgreSQL startup checks.

## GitHub Pages Frontend Deploy

The static React/Vite frontend can be deployed to GitHub Pages at:

```txt
https://rigocrypto.github.io/Libre-Ride-Sharing-Dapp/
```

GitHub Pages is frontend-only. It can host the landing page, `/founding-access`, `/privacy`, and static demo routes, but it cannot run Express API routes, auth sessions, PostgreSQL/Drizzle, escrow verification, WebSockets, lead capture persistence, or admin CRM routes.

For Pages builds, the workflow sets:

```txt
GITHUB_PAGES=true
```

That makes Vite use:

```txt
/Libre-Ride-Sharing-Dapp/
```

as the asset/router base path. If forms or admin pages should work from GitHub Pages, deploy the backend separately and set:

```txt
VITE_API_BASE_URL=https://your-backend.example.com
```

The Pages workflow reads `VITE_API_BASE_URL` from GitHub Actions secrets during build.

## Render Backend Deploy

The Express API can be deployed separately to Render using `render.yaml`. This is the recommended first hosted backend for Founding Access lead capture because it supports a persistent Node web service, WebSockets, sessions, and a managed Postgres database without refactoring the Express app.

Recommended Render variables:

```txt
NODE_ENV=production
DATABASE_URL=postgresql://...  # provided by the Render Postgres database
SESSION_SECRET=...
FRONTEND_ORIGIN=https://rigocrypto.github.io
STORAGE_ENGINE=drizzle
RESEND_API_KEY=
ESCROW_CONTRACT_ADDRESS=0xE4995d77BffAcB05AF23764bf2831FCC35B4888F
USDC_TOKEN_ADDRESS=0xcb27336B232eA62469D0d2DEcDAC016d23CE1414
RPC_URL_BASE_SEPOLIA=
PLATFORM_WALLET_ADDRESS=0xb4CfAB88357D0f8C817a0b4E8C95D7B067C49Ac0
ARBITER_ADDRESS=0xb4CfAB88357D0f8C817a0b4E8C95D7B067C49Ac0
ESCROW_VERIFIER_MODE=mock
```

Render runs `npm run db:push` during the Blueprint build before compiling the app, so the Postgres schema is created before the API starts. In production, Drizzle/Postgres initialization fails hard instead of falling back to in-memory storage.

The production API exposes:

```txt
GET /health
```

After deploy, set the GitHub Actions secret:

```txt
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Trigger the Pages workflow again so the static frontend points at the live API.

Render smoke test:

```txt
GET /health
POST /api/leads/founding-driver
POST the same email again and expect 409
GET /api/admin/leads/drivers without auth and expect 401 or 403
Restart the Render service and confirm the lead remains in Postgres
```

## Docker

The repository includes `docker-compose.yml` for local service orchestration. Confirm required environment variables first, then run:

```powershell
docker compose up --build
```

Common local services may include Postgres, Redis, Mailhog, mock notification tooling, the API, and the client depending on the active compose profile.

## Database Migrations & Seeding

For production-like database testing, configure:

```txt
DATABASE_URL=
STORAGE_ENGINE=drizzle
```

Then run the Drizzle command:

```powershell
npm.cmd run db:push
```

SQL migrations live under `migrations/`. Confirm the current migration path and storage engine before running destructive database changes.

Dev-only seed routes are isolated in `server/routes.dev.ts` and are only registered when `NODE_ENV !== 'production'`.

## Smart Contracts

Foundry configuration lives in `foundry.toml`.

Run contract tests:

```powershell
forge test -vv
```

Deploy `RideEscrow` to Base Sepolia:

```powershell
forge script contracts/script/DeployRideEscrow.s.sol `
  --rpc-url $env:RPC_URL_BASE_SEPOLIA `
  --private-key $env:DEPLOYER_PRIVATE_KEY `
  --broadcast `
  --verify `
  -vvvv
```

If Basescan verification fails because of an API key issue, re-run verification without redeploying after setting `BASESCAN_API_KEY`.

## Testing

Core verification commands:

```powershell
npm.cmd run check
npm.cmd test -- --run
npm.cmd run build
npm.cmd run test:e2e
forge test -vv
```

Current coverage includes:

- Ride acceptance race-condition tests
- Escrow state-machine tests
- Escrow contract tests
- Playwright smoke flow

Before opening a pull request, run the verification commands relevant to your change.

## Security

Security hardening is tracked in [SECURITY.md](SECURITY.md).

Recent hardening reduced local npm audit results from critical/high issues to low-only issues.

Security priorities before production:

- Smart contract audit
- Payment route review
- WebSocket authorization review
- Rate limiting
- Request validation
- Escrow transaction replay protection
- Admin RBAC
- Audit logging
- Secrets management
- Production CI security checks

## Production Readiness

Production readiness is tracked in [docs/PRODUCTION_READINESS_CHECKLIST.md](docs/PRODUCTION_READINESS_CHECKLIST.md).

LIBRE should not be considered live-production-ready until:

- Real two-wallet authenticated ride flow is validated.
- Contract source is verified on Basescan.
- Production database is migration-tested.
- Firebase/KYC/storage integrations are validated.
- Driver compliance workflow is operational.
- Admin approval workflow is operational.
- Rate limiting and validation are active.
- WebSocket authorization is reviewed.
- Smart contract review is complete.
- Staging pilot ride is completed end to end.

## Roadmap

See:

- [docs/IMPLEMENTATION_TICKETS.md](docs/IMPLEMENTATION_TICKETS.md)
- [docs/ESCROW_STATE_MACHINE.md](docs/ESCROW_STATE_MACHINE.md)
- [docs/DRIVER_SUBSCRIPTION_BENEFITS.md](docs/DRIVER_SUBSCRIPTION_BENEFITS.md)
- [docs/RIDER_SUBSCRIPTION_TIERS.md](docs/RIDER_SUBSCRIPTION_TIERS.md)
- [ORLANDO_AI_COMPLIANCE_ROADMAP.md](ORLANDO_AI_COMPLIANCE_ROADMAP.md)

Near-term priorities:

1. Complete `TICKET-025`: real driver wallet auth plus escrow-gated ride start.
2. Verify contract source on Basescan.
3. Add admin escrow monitoring.
4. Validate production database path.
5. Complete driver compliance approval workflow.
6. Run limited Orlando staging pilot with two real wallets.
7. Prepare legal/compliance review before public launch.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| TypeScript errors after dependency update | Run a clean install and verify lockfile changes. |
| Wallet not detecting Base Sepolia | Confirm chain ID `84532`, RPC URL, and wallet network. |
| Approval succeeds but deposit fails | Check USDC allowance, escrow address, token address, and wallet network. |
| Backend rejects deposit tx | Check `ESCROW_CONTRACT_ADDRESS`, `USDC_TOKEN_ADDRESS`, `RPC_URL_BASE_SEPOLIA`, `ESCROW_VERIFIER_MODE`, and tx hash formatting. |
| PostgreSQL checks running in local tests | Use `STORAGE_ENGINE=mem`. |
| Upload errors | Confirm UploadThing keys and callback URLs. |
| Push notifications not working | Confirm OneSignal sandbox/app credentials. |
| E2E port conflicts | Ensure no dev server is already listening on port 5000. |
| GitHub Dependabot count looks stale | Wait for GitHub rescan and compare against local `npm audit`. |

## Legal and Compliance Notice

LIBRE is an early-stage software project. It is not currently a live licensed transportation company, investment offering, money transmission service, insurance product, or public token sale.

Before public launch, the project should receive legal review for:

- Transportation/TNC operations
- Insurance requirements, including Florida Statutes Section 627.748
- Airport pickup rules
- Driver onboarding
- KYC/background checks
- Stablecoin payments
- Escrow handling
- Token/reward design
- Subscriptions
- Driver benefits
- Privacy and data retention
- Investment or fundraising structures

Nothing in this repository should be interpreted as legal, financial, insurance, or investment advice.

## Contributing

Contributions should preserve:

- TypeScript safety
- Tested ride state transitions
- Escrow state-machine integrity
- Payment safety
- Compliance-first design
- Privacy-conscious data handling
- Clear documentation

Before submitting changes:

```powershell
npm.cmd run check
npm.cmd test -- --run
npm.cmd run build
npm.cmd run test:e2e
```

## Contact

LIBRE is being built as an Orlando-first Web3 ride-sharing MVP focused on transparency, driver empowerment, and safer local transportation infrastructure.

For collaboration, driver onboarding, partnerships, or investment discussions, contact the LIBRE core team.
