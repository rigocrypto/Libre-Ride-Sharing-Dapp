# Libre Ride — Web3 Ride-Sharing Platform

Libre Ride is a Florida-compliant, Web3-enabled ride-hailing platform targeting the Orlando market. The project pairs a Vite/React client with an Express/TypeScript API, Drizzle/Postgres persistence, UploadThing-backed document storage, and real-time services (Redis, WebSockets, notifications) to deliver a production-ready MVP.

## Table of Contents

1. [Stack Overview](#stack-overview)
2. [Key Capabilities](#key-capabilities)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Environment Variables](#environment-variables)
6. [Getting Started](#getting-started)
    - [Quick Start (Docker)](#quick-start-docker)
    - [Manual Dev Setup](#manual-dev-setup)
7. [Database Migrations & Seeding](#database-migrations--seeding)
8. [Testing](#testing)
9. [Notifications & Integrations](#notifications--integrations)
10. [Compliance Workflow](#compliance-workflow)
11. [Deployment Notes](#deployment-notes)
12. [Troubleshooting](#troubleshooting)

---

## Stack Overview

| Layer        | Technology                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| Client       | React 18 + Vite + TypeScript, TanStack Query, Tailwind + Radix UI, Wagmi/RainbowKit          |
| Server       | Express + TypeScript, Zod validation, UploadThing, Socket.io (planned), Redis pub/sub        |
| Persistence  | Drizzle ORM + Postgres (Neon/local), Redis for presence/queues                               |
| Web3         | Base network (testnet/mainnet), USDC transfer flow, AA scaffolding                           |
| Notifications| Resend (email), Twilio (SMS), OneSignal (push) + Mailhog/Mock services for dev               |
| DevOps       | Docker Compose, pnpm/NPM scripts, GitHub Actions CI                                          |

---

## Key Capabilities

- **Rider & Driver Flows:** Request rides, track status, view driver stats, manage profiles.
- **Compliance Automation:** Driver license, vehicle photos, insurance, background checks, Orlando permit, airport eligibility.
- **Document Storage:** UploadThing-backed storage with metadata + OCR placeholders.
- **Real Payments:** Wallet connect (RainbowKit/Wagmi) + USDC escrow flow on Base testnet (AA-friendly).
- **Real-Time Operations:** Driver presence, ride matching, SOS, disputes, admin dashboards.
- **Notifications:** Email (Resend), SMS (Twilio), Push (OneSignal) with local mocks for dev.

---

## Architecture

```
client/                 React SPA (Vite)
server/                 Express API + WebSocket + workers
shared/schema.ts        Drizzle schema + types shared across layers
dev-tools/onesignal-mock   Local webhook logger for OneSignal payloads
migrations/             SQL migrations (authoritative schema)
docker-compose.yml      Postgres, Redis, Mailhog, OneSignal mock, server, client
.github/workflows/      CI pipelines
```

---

## Prerequisites

- Node.js 20+
- pnpm 9+ (recommended) or npm 10+
- Docker + Docker Compose v2
- Access keys for:
  - Postgres (Neon/local)
  - UploadThing (or S3 replacement)
  - Resend, Twilio, OneSignal
  - Base RPC provider (Alchemy, Infura, etc.)

---

## Environment Variables

All services read from `.env`. Copy `.env.example`:

```bash
cp .env.example .env
```

Key groups:

- **Database/Cache:** `DATABASE_URL`, `REDIS_URL`, `STORAGE_ENGINE`
- **Web3:** `NEXT_PUBLIC_BASE_CHAIN_ID`, `NEXT_PUBLIC_ALCHEMY_BASE_RPC`, `PRIVATE_KEY_DEPLOYER`, `USDC_CONTRACT_ADDRESS_TESTNET`
- **Notifications:** `RESEND_API_KEY`, `TWILIO_*`, `ONESIGNAL_*`, `MAILHOG_SMTP`
- **Uploads:** `UPLOADTHING_API_KEY`, `UPLOADTHING_SECRET`
- **Feature Toggles:** `ENABLE_PAYMENTS`, `ENABLE_AA`, `ENABLE_PUSH`
- **Compliance:** `RETENTION_DAYS`, `PROTOCOL_FEE_BPS`

Refer to the full `.env.example` for descriptions/defaults.

---

## Getting Started

### Quick Start (Docker)

```bash
# 1. copy env template & fill secrets
cp .env.example .env.compose   # used by docker-compose

# 2. start full stack
docker compose up --build

# services exposed on:
# client: http://localhost:5173
# api:    http://localhost:5000
# mailhog ui: http://localhost:8025
# onesignal mock: http://localhost:5010/health
```

### Manual Dev Setup

```bash
pnpm install

# start Postgres/Redis locally or via docker compose
pnpm db:push             # run drizzle migrations
pnpm tsx server/scripts/seed.ts

# in two terminals
pnpm --filter server dev
pnpm --filter client dev
```

---

## Database Migrations & Seeding

1. Apply SQL migrations (authoritative schema):

```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
```

2. Seed sample Orlando data:

```bash
pnpm tsx server/scripts/seed.ts
```

3. Optional Drizzle migrations via `pnpm db:push` (keep SQL in sync).

---

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test             # add Vitest/Jest suites
forge test            # once contracts live
```

The CI workflow mirrors these steps plus build + migration checks.

---

## Notifications & Integrations

- **Email:** Resend (dev fallback: Mailhog via `MAILHOG_SMTP`)
- **SMS:** Twilio – `/api/auth/send-sms` + `/api/auth/verify-sms`
- **Push:** OneSignal – use `dev-tools/onesignal-mock` in Docker for local testing
- **Uploads:** UploadThing endpoints configured under `/api/uploadthing`

Each integration reads from `.env`; provide sandbox/test keys in dev.

---

## Compliance Workflow

1. Driver uploads profile/license/vehicle/insurance docs (UploadThing)
2. Server saves metadata → Drizzle tables (`driver_photos`, `vehicle_photos`, etc.)
3. Verification jobs (queue/cron) run OCR + rule checks
4. Admin dashboard surfaces `pending` / `requires_manual_review`
5. When approved, driver unlocked for ride matching and airport zones

Ensure Florida TNC rules:

- License + background re-check every 3 years
- Vehicle < 15 years, four-door, wheelchair flag respected
- Orlando permit + airport authorization before airport pickups

---

## Deployment Notes

- Use `.github/workflows/ci.yml` for CI gate (lint, typecheck, tests, builds, migrations)
- Build production images with `server.Dockerfile` / `client/Dockerfile`
- Configure secrets (DB, Redis, UploadThing, Alchemy, Twilio, Resend, OneSignal) in hosting provider
- Prefer deploying server + Postgres + Redis on Fly.io/Railway/Render; client can go to Vercel/Netlify

---

## Troubleshooting

| Issue                                   | Fix                                                                 |
|-----------------------------------------|----------------------------------------------------------------------|
| `pg_isready` failures in Docker         | Remove `libre-postgres-data` volume to reinit DB                     |
| UploadThing errors                      | Confirm `UPLOADTHING_*` env + correct callback URLs                  |
| Resend emails not showing               | In dev, point SMTP to Mailhog and inspect http://localhost:8025      |
| Wallet connect not detecting Base       | Ensure `NEXT_PUBLIC_BASE_CHAIN_ID` + RPC envs set; reload provider   |
| Redis connection refused                | Check `REDIS_URL`, ensure container running                          |

---

Happy building! Reach out to the Libre core team for Base RPC keys, UploadThing creds, and compliance audit workflows. Continuous upgrades tracked in `NEXT_TASKS.md`.

