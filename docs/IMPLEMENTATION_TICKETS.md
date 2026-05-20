# RideShareDapp Implementation Tickets

This backlog converts the production roadmap into buildable engineering work. Phase 1 is deliberately narrow: prove one real escrow-protected ride flow before expanding into subscriptions, AI, or broad marketplace features.

## Phase 0 - Security Hardening

### TICKET-021: Resolve Dependabot Security Vulnerabilities

Priority: Critical
Status: Completed

Acceptance Criteria:

- `npm audit` is run and reviewed.
- Direct vulnerabilities are separated from transitive vulnerabilities.
- Safe direct dependency upgrades are applied first.
- `npm audit fix --force` is avoided unless breaking changes are reviewed.
- Overrides are used only where the transitive package path is otherwise blocked.
- Critical vulnerabilities are resolved or explicitly documented if blocked.
- High vulnerabilities are reduced as much as safely possible.
- Remaining vulnerabilities are documented in `SECURITY.md` with reason and risk level.
- Full verification runs: `check`, unit tests, production build, and E2E smoke tests.
- Security hardening commit is pushed.

## Phase 1 - Escrow Production Core

### TICKET-001: Deploy Escrow Contract To Base Sepolia

Priority: Critical  
Status: Not Started

Acceptance Criteria:

- Escrow contract deploys successfully to Base Sepolia.
- Contract address is stored in environment configuration.
- Contract ABI is available to frontend and backend.
- Deployment transaction hash is recorded.
- Contract can receive test USDC or mock USDC.
- Deposit, release, refund, and dispute paths are manually verified.
- Deployment steps are documented for repeatability.

### TICKET-002: Wire Real Rider Wallet Deposit Flow

Priority: Critical  
Status: Not Started

Acceptance Criteria:

- Rider can connect wallet.
- Rider sees ride fare in USD/USDC.
- Rider signs deposit transaction.
- UI shows pending state while transaction confirms.
- Backend verifies transaction hash.
- Ride escrow state changes to `DEPOSIT_CONFIRMED`.
- Driver cannot start ride before escrow confirmation.
- Failed or rejected wallet transactions show recoverable UI errors.

### TICKET-003: Backend Escrow Transaction Verification

Priority: Critical  
Status: Not Started

Acceptance Criteria:

- Backend verifies chain ID, contract address, sender, amount, token, ride ID, and transaction status.
- Duplicate transaction hashes are rejected.
- Failed or reverted transactions do not update escrow state.
- Each confirmed transaction is tied to one ride only.
- Verification result is persisted with timestamp and raw chain metadata.
- Verification errors are visible in admin payment logs.

### TICKET-004: Enforce Escrow State Machine In Code

Priority: Critical  
Status: Complete

Acceptance Criteria:

- Escrow states are defined in a shared TypeScript module.
- Allowed transitions are defined in one canonical map.
- Backend uses the validator before mutating escrow state.
- Invalid transition errors include current state, target state, and reason.
- Unit tests cover valid and invalid transitions.
- Documentation and code state names match.

### TICKET-005: Persist Escrow State In PostgreSQL

Priority: Critical  
Status: Not Started

Acceptance Criteria:

- Escrow record stores ride ID, rider ID, driver ID, state, chain ID, contract address, amount, token, and transaction hashes.
- Database enforces one active escrow per ride.
- Database enforces unique transaction hashes.
- Migration runs cleanly on staging database.
- Rollback plan is documented.
- Existing mem-storage tests still pass.

### TICKET-006: Release, Refund, And Dispute Actions

Priority: Critical  
Status: Not Started

Acceptance Criteria:

- Release can occur only from valid states.
- Refund can occur only from valid states.
- Dispute freezes release/refund.
- Admin dispute decision can release, refund, or split.
- Every release/refund/dispute action is audit logged.
- E2E happy path covers deposit to release.
- Manual QA covers refund and dispute.

### TICKET-024: Live End-to-End Wallet Test

Priority: Critical  
Status: Complete

Results:

- Ride ID: `711efbe9-604f-414c-8d08-99f23eb0b68d`
- Rider wallet: `0xb4CfAB88357D0f8C817a0b4E8C95D7B067C49Ac0`
- Escrow contract: `0xE4995d77BffAcB05AF23764bf2831FCC35B4888F`
- Mock USDC: `0xcb27336B232eA62469D0d2DEcDAC016d23CE1414`
- Approval tx: `0x13fac0c80ee89ccc68482ce34b53a107b7de191c6986ce98cf59cdd3c052b1df`
- Deposit tx: `0x5d949a4dee7b26711c40085fc78876905451fdb8b5961ea96a091a37a13c52a5`
- Release tx: `0x52b5ddd5d9d62ae1e2f196846d84ab43de1bf1b4ab51c612741cc766f3bc5ecd`
- Fare: 25 USDC
- Fee: 300 bps, 0.75 USDC
- Driver payout: 24.25 USDC
- Final escrow balance: 0 USDC
- Backend escrow state path: `locked` -> `released`

Caveat:

- `/api/rides/:id/start` returned 403 with a dummy driver wallet. Payment rail is proven; authenticated driver wallet flow is the next dependency.

### TICKET-025: Wire Real Driver Auth For Escrow-Gated Ride Start

Priority: Critical  
Status: In Progress

Acceptance Criteria:

- A registered driver wallet can complete auth, wallet verification, and SIWE.
- Driver account passes the current approval gate required for ride acceptance/start.
- Driver accepts a ride after rider escrow reaches `locked`.
- `/api/rides/:id/start` succeeds only for the assigned authenticated driver.
- `/api/rides/:id/start` still returns 402 when escrow is not locked.
- Live test uses two real wallets: rider and driver.
- No dev seed wallet override is required for the authenticated happy path.

Implementation Notes:

- Server-side ride start guard now checks assigned driver ID, assigned driver wallet, ride state, and escrow status.
- Driver acceptance now requires an approved, wallet-verified driver account.
- Final completion still requires a live two-wallet Base Sepolia run with a registered driver wallet.
- Manual proof checklist: `docs/STAGING_QA_PLAN.md`.

### TICKET-026: Admin Escrow Monitoring Dashboard

Priority: Critical  
Status: Complete

Acceptance Criteria:

- Admin can inspect escrowed rides from a protected admin endpoint.
- Dashboard shows locked, pending, failed, disputed, released, refunded, and manual-review counts.
- Dashboard table includes ride ID, rider wallet, driver wallet, ride status, escrow status, amount, token, chain ID, deposit tx hash, verification mode, and timestamps.
- Operators can filter by escrow status, ride status, token, chain, verification mode, manual review, and ride/wallet search.
- Pending deposits older than 15 minutes are flagged for manual review.
- Admin endpoint remains protected by admin authentication and authorization.
- Operator actions are disabled placeholders until release/refund/retry backend support is added.

### TICKET-027: Escrow Release, Refund, And Dispute Admin Workflow

Priority: Critical  
Status: Complete

Acceptance Criteria:

- Admin can open escrow detail for a monitored ride.
- Detail view shows ride ID, rider wallet, driver wallet, ride status, escrow status, amount, token, chain, tx hash, verifier mode, timestamps, manual-review signal, and audit history.
- Admin action routes are protected by `requireAuth` and `requireRole("admin")`.
- Admin actions require a reason with at least 10 characters.
- Invalid escrow transitions are rejected before mutation.
- Mark manual review, retry verification, and dispute review create typed audit entries.
- Release/refund remain backend-disabled outside explicit mock admin action mode until live contract execution is wired.
- Mock admin action mode can deterministically exercise release/refund without touching real funds.

### TICKET-028: Persistent Audit Logs And Admin Activity Timeline

Priority: High  
Status: Complete

Acceptance Criteria:

- Audit logs persist to Postgres when database storage is active.
- MemStorage/test mode keeps deterministic in-memory audit fallback.
- Audit entries include actor user ID, actor role, actor wallet, action, ride ID, previous state, next state, reason, metadata, and timestamp.
- Admin can fetch global audit logs from a protected endpoint.
- Admin can fetch ride-scoped audit logs from a protected endpoint.
- Escrow detail modal shows the action timeline.
- Admin Activity tab supports filtering by action, ride ID, and actor.
- Non-admin users cannot access audit log routes.

## Phase 2 - Driver Compliance And Admin Operations

### TICKET-029: Driver Compliance Approval Workflow

Priority: Critical
Status: Complete

Acceptance Criteria:

- Admin can list and inspect driver compliance applications.
- Admin can approve, reject, suspend, and request updated documents from protected routes.
- Rejection, suspension, and document requests require a reason with at least 10 characters.
- Compliance decisions write persistent audit entries when database storage is active.
- Driver dispatch eligibility is blocked for rejected, suspended, manual-review, unverified, or expired-document states.
- Document expiration detection runs on startup and every 24 hours.
- Orlando permit number/expiration, MCO eligibility, and background-check provider fields are represented in schema.
- Admin UI includes a Driver Compliance tab with filters, review modal, warnings, and action buttons.
- Existing check, unit tests, build, and E2E verification remain passing.

### TICKET-030: LIBRE Founding Access Landing Page

Priority: High
Status: Complete

Acceptance Criteria:

- Public `/founding-access` landing page targets Orlando drivers, investors, sponsors, and partners.
- Page includes hero, problem, Orlando market, product demo, founding driver, investor, technology, use-of-funds, and compliance notice sections.
- Driver and investor/partner lead forms persist to Drizzle/Postgres lead tables with MemStorage/test fallback.
- Duplicate lead emails return friendly duplicate messages.
- Admin lead list endpoints are protected by `requireAuth` and `requireRole("admin")`.
- Page avoids investment-return promises and clearly states interest collection only.
- Existing check, unit tests, build, and E2E verification remain passing.

### TICKET-031: Founding Access CRM and Conversion Upgrade

Priority: High
Status: Complete

Acceptance Criteria:

- Founding driver and investor leads include CRM status, source, referral, score, follow-up, notes, and intent fields.
- Lead scoring prioritizes Orlando drivers, active rideshare drivers, airport interest, insurance readiness, investor range, accredited status, deck/demo requests, and strategic partnership signals.
- Forms require contact/privacy/compliance consent before submission.
- Driver form captures source, preferred Orlando zones, airport experience, WhatsApp invite, and demo access intent.
- Investor form captures source, preferred next step, deck request, demo access intent, and investment-offering acknowledgment.
- Confirmation email attempts use Resend when configured and gracefully fall back in dev/test.
- Admin lead CRM tab supports filtering, status updates, and protected CSV exports.
- Landing page includes traction, roadmap, stronger risk disclosure, privacy page link, robots.txt, and sitemap.xml.
- Existing check, unit tests, build, and E2E verification remain passing.

### TICKET-032: GitHub Pages Frontend Deployment

Priority: High
Status: Complete

Acceptance Criteria:

- Vite uses `/Libre-Ride-Sharing-Dapp/` as the base path only when `GITHUB_PAGES=true`.
- Wouter receives the same base path so direct GitHub Pages routes resolve correctly.
- GitHub Actions Pages workflow builds `dist/public`, creates `404.html` SPA fallback, uploads the artifact, and deploys via Pages.
- README documents GitHub Pages as frontend-only and explains `VITE_API_BASE_URL` for separately hosted backend APIs.
- Founding Access includes JSON-LD metadata and a real `og-libre-founding.png` social preview image.
- robots.txt and sitemap.xml point to the GitHub Pages URL.
- Existing check, unit tests, build, and E2E verification remain passing.

### TICKET-033: Render Backend API Deployment Prep

Priority: Critical
Status: Complete

Acceptance Criteria:

- Express exposes `GET /health` for Render health checks.
- API CORS allows the GitHub Pages origin and optional `FRONTEND_ORIGIN`.
- `render.yaml` provisions a Node web service and free Render Postgres database.
- `render.yaml` runs `npm run db:push` before build so fresh Render deploys create the Drizzle schema.
- Render healthcheck path points to `/health`.
- Production storage initialization fails hard if Drizzle/Postgres cannot initialize, preventing silent MemStorage fallback.
- GitHub Pages workflow passes `VITE_API_BASE_URL` from Actions secrets into the frontend build.
- README documents Render environment variables, backend/frontend split, migration behavior, smoke test steps, and GitHub secret setup.
- Existing check, unit tests, build, and E2E verification remain passing.

### TICKET-034A: Harden Render Production Storage and Migration

Priority: Critical
Status: Complete

Acceptance Criteria:

- Production does not fall back to MemStorage if Drizzle/Postgres fails.
- Render deployment runs `npm run db:push` before the production build.
- `/health` works after deploy.
- Founding driver and investor leads can persist across service restart.
- Duplicate email handling still returns friendly `409` responses.

### TICKET-007: Production Driver Approval Workflow

Priority: Critical  
Status: Superseded by TICKET-029

Acceptance Criteria:

- Driver can submit required compliance documents.
- Admin can approve, reject, suspend, and reinstate driver.
- Rejection reasons are visible to driver.
- Expired documents block eligible ride categories.
- Every admin action is audit logged.

### TICKET-008: Insurance Coverage Gate

Priority: Critical  
Status: Not Started

Acceptance Criteria:

- Driver insurance certificate is required before active rides.
- Admin can record policy number, coverage limits, insurer, named insured, and expiration.
- System flags missing TNC/commercial coverage language.
- Expired insurance blocks driver from going online.
- Legal disclaimer is visible in onboarding.

### TICKET-009: Orlando/MCO Eligibility Workflow

Priority: High  
Status: Not Started

Acceptance Criteria:

- Driver can upload Orlando/MCO-related permits or credentials.
- Admin can mark driver as airport eligible.
- Airport eligibility expires independently from general driver approval.
- Airport rides prioritize eligible drivers.
- Rider sees airport-eligible driver badge where relevant.

### TICKET-010: Admin Command Center MVP

Priority: High  
Status: Not Started

Acceptance Criteria:

- Admin can view active rides.
- Admin can view active escrows.
- Admin can view stuck payments.
- Admin can view pending driver approvals.
- Admin can view disputes.
- Admin can view failed transaction logs.
- Admin actions are role-gated and audit logged.

## Phase 3 - Fare Transparency And Risk Controls

### TICKET-011: Toll-Aware Fare Estimator

Priority: High  
Status: Not Started

Acceptance Criteria:

- Fare estimate includes toll line item when route uses toll roads.
- Fare breakdown includes base fare, distance, time, tolls, airport fee, platform fee, and network fee.
- Quote has expiration timestamp.
- Rider sees escrow amount before paying.
- Admin can inspect fare components on a ride.

### TICKET-012: AI Dispatch Scoring V1

Priority: High  
Status: Not Started

Acceptance Criteria:

- Driver matching uses configurable scoring weights.
- Score includes proximity, reliability, compliance, vehicle match, airport eligibility, rating, and escrow readiness.
- Airport rides weight compliance and airport eligibility higher.
- Match decision stores input scores for later review.
- Admin can inspect why a driver was selected.

### TICKET-013: Ride Risk Scoring V1

Priority: High  
Status: Not Started

Acceptance Criteria:

- Risk score is calculated before escrow release.
- Score includes account age, disputes, cancellations, payment failures, device/wallet mismatch, and abnormal ride patterns.
- High-risk rides can trigger manual review.
- Risk score is visible to admin.
- Risk decisions are audit logged.

## Phase 4 - Safety, Disputes, And Privacy

### TICKET-014: Dispute Center MVP

Priority: High  
Status: Not Started

Acceptance Criteria:

- Rider or driver can file dispute during dispute window.
- Escrow freezes while dispute is open.
- Evidence can be uploaded.
- Admin can decide release, refund, or split.
- SLA timers are visible in admin.
- Final decision is audit logged.

### TICKET-015: Safety And SOS MVP

Priority: High  
Status: Not Started

Acceptance Criteria:

- Rider can trigger SOS during active ride.
- Active ride sends location heartbeat.
- Emergency contact can receive trip-sharing link.
- Admin receives real-time alert.
- Incident evidence package is created.
- Retention policy is documented.

### TICKET-016: Privacy And Data Retention Controls

Priority: High  
Status: Not Started

Acceptance Criteria:

- Sensitive document access is role-restricted.
- PII is masked in logs.
- GPS retention policy is implemented.
- Identity document retention policy is implemented.
- Data export/deletion process is documented.
- Audit logs track sensitive data access.

## Phase 5 - Monetization And Benefits

### TICKET-017: Driver Subscription Benefits Beta

Priority: Medium  
Status: Not Started

Acceptance Criteria:

- Feature flag controls subscription visibility.
- Standard/Pro/Elite tiers are configurable.
- Repair rewards ledger exists.
- Claims workflow exists in beta/admin-only mode.
- Legal review is complete before insurance-like claims are marketed.
- Subscriptions do not block core pilot launch.

### TICKET-018: Rider Subscription And Tourist Bundle Beta

Priority: Medium  
Status: Not Started

Acceptance Criteria:

- Feature flag controls subscription visibility.
- Rider Plus/Elite tiers are configurable.
- MCO Arrival Bundle can be purchased in test mode.
- Ride credits ledger exists.
- Credits cannot exceed configured redemption cap.
- Subscriptions do not block core pilot launch.

## Phase 6 - Pilot Launch

### TICKET-019: Staging Ride Pilot

Priority: Critical  
Status: Not Started

Acceptance Criteria:

- One staging ride completes from request to wallet-signed deposit to driver acceptance to trip completion to release.
- Driver is approved through production-like compliance workflow.
- Escrow state transitions are recorded correctly.
- Admin can inspect ride, payment, driver, and audit log.
- Manual QA notes are recorded.

### TICKET-020: Limited Orlando Corridor Pilot

Priority: High  
Status: Not Started

Acceptance Criteria:

- Pilot corridor is defined, preferably MCO to International Drive/Convention Center.
- 20-30 verified drivers are onboarded manually.
- Support process is staffed for pilot hours.
- Incident and dispute escalation paths are ready.
- Metrics dashboard tracks completion rate, acceptance time, pickup ETA, disputes, and payment failures.
