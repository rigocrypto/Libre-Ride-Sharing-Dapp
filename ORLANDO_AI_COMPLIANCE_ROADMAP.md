# Libre Ride Orlando AI + Compliance Roadmap

## Positioning

Libre Ride should not position itself as a generic decentralized Uber. The strongest wedge is:

> MCO-verified, escrow-protected, compliance-first Orlando mobility for airport, tourist, and private-driver rides.

The product should feel like a smart local transportation network: verified Orlando operators, transparent USDC escrow, AI-assisted dispatch, explicit toll/airport fee handling, and compliance workflows designed for real-world transportation regulation.

## Current Foundation Already In Place

- Full-stack React/Vite/TypeScript frontend and Express/TypeScript backend.
- Rider payment-first smoke flow passing locally.
- Driver acceptance flow with race-condition unit test.
- Ride states for offered, accepted, in-progress, completed, and cancelled flows.
- Escrow backend scaffolding and compatibility endpoints.
- WebSocket layer plus polling fallback for rider updates.
- Wallet/Web3 dependencies: RainbowKit, Wagmi, Viem.
- Account abstraction scaffolding.
- Firebase/SIWE/auth scaffolding.
- Upload/document components.
- Florida/Orlando compliance schema and documentation foundation.
- Admin, referral, SOS, dispute, badge, and rewards scaffolding.
- Playwright E2E and Vitest verification.

## Priority 1: Real USDC Escrow Payment UX

The most important production gap is live wallet execution. The current backend and smoke flow simulate or confirm escrow, but the real production path needs on-chain validation.

Required flow:

1. Rider requests ride.
2. App quotes price in USD and USDC.
3. Rider chooses "Pay with USDC."
4. Wallet signs approval/deposit transaction.
5. Backend verifies escrow contract event on-chain.
6. Ride becomes eligible for driver start.
7. Driver completes ride.
8. Rider confirms or auto-release triggers after timeout.
9. Driver receives USDC minus platform fee.

Payment states to add:

- `PAYMENT_PENDING`
- `PAYMENT_CONFIRMED`
- `PAYMENT_FAILED`
- `ESCROW_LOCKED`
- `RELEASE_PENDING`
- `RELEASED`
- `REFUND_PENDING`
- `REFUNDED`
- `DISPUTED`

Production requirements:

- Contract event listener for deposits, releases, refunds, and disputes.
- Transaction hash uniqueness constraint.
- Idempotency keys on payment endpoints.
- Replay protection on escrow confirmations.
- Chain ID and contract address validation.
- Escrow amount validation against quoted fare.
- Manual admin release/refund tools with audit logging.

## Priority 2: Orlando Compliance Layer

Compliance should become a core product surface, not a hidden admin checklist. The City of Orlando Vehicle for Hire process references driver and vehicle registration, vehicle inspection, business tax receipt, nationwide background check, Florida driver license, insurance certificate, and other transportation-company documents.

Modules to build:

- Driver permit upload and expiration tracking.
- Florida driver license upload and validation.
- Nationwide criminal background check proof.
- Vehicle inspection upload.
- Florida vehicle registration upload.
- Commercial liability insurance certificate upload.
- Business tax receipt upload.
- Orlando vehicle-for-hire status.
- MCO airport eligibility status.
- Admin approval/rejection workflow.
- Auto-expiration alerts.
- Compliance audit log.
- Rider-visible verified/compliant driver badges.

Suggested compliance statuses:

- `NOT_STARTED`
- `DOCUMENTS_REQUIRED`
- `AI_REVIEW_PENDING`
- `AI_REVIEW_FLAGGED`
- `ADMIN_REVIEW_PENDING`
- `APPROVED`
- `REJECTED`
- `EXPIRED`
- `SUSPENDED`

## Priority 3: Insurance Gap Management

This needs its own product and legal track. Personal auto insurance may exclude TNC/commercial activity, and Florida TNC insurance rules create operational coverage questions depending on whether the driver is offline, logged in, matched, or actively transporting a rider.

Build an insurance gate before real rides:

- Require TNC endorsement or commercial/for-hire coverage.
- Store policy number, insurer, coverage limits, named insured, expiration, and certificate source.
- Require insurance agent-issued certificate where applicable.
- Track coverage period:
  - Period 0: driver offline.
  - Period 1: driver online, no ride accepted.
  - Period 2: ride accepted, en route to pickup.
  - Period 3: rider in vehicle.
- Show admin warnings for missing period coverage.
- Block airport/commercial rides when coverage is insufficient.
- Add renewal reminders at 30/14/7/1 days.

Legal/product caution:

- Do not rely on a driver's personal policy unless counsel confirms the coverage applies to rideshare/for-hire use.
- Explore partnerships with TNC/commercial insurance providers before public launch.

## Priority 4: Florida Toll Road Integration

Orlando fares must handle tolls explicitly. MCO, Disney, Universal, Lake Nona, International Drive, and convention traffic often touch toll roads including SR 408, SR 417, SR 429, SR 528/Beachline, and the Turnpike.

Add a toll module:

- Route-aware toll estimate before booking.
- SunPass/E-PASS/Toll-by-Plate cost handling.
- Toll line item in fare breakdown.
- Driver transponder status.
- Toll reconciliation after ride.
- Admin toll dispute support.
- Higher quote confidence when the selected route uses toll roads.

Fare display should include:

```txt
Base fare: $5.00
Distance: $14.20
Time: $6.40
Airport fee: $3.00
Estimated tolls: $4.25
Platform fee: $1.80
Escrow/network fee: $0.35
Estimated total: $34.00
```

## Priority 5: AI Dispatch + Smart Matching

Build matching as a scoring engine, not random availability.

Initial score:

```ts
driverScore =
  proximityScore * 0.25 +
  reliabilityScore * 0.20 +
  complianceScore * 0.20 +
  vehicleMatchScore * 0.15 +
  airportEligibilityScore * 0.10 +
  ratingScore * 0.05 +
  escrowReadinessScore * 0.05;
```

Context-specific weighting:

- Airport ride: compliance, MCO eligibility, luggage capacity, and staging proximity matter more.
- Tourist/family ride: rating, vehicle size, child-seat availability, and language preference matter more.
- Late-night ride: reliability, safety history, and proximity matter more.
- Accessibility ride: WAV eligibility and training should dominate.

Learning loop:

- Store match inputs, selected driver, accepted/rejected status, pickup ETA, cancellation, dispute, rating, and completion outcome.
- Review outcomes weekly.
- Tune weights by corridor and ride category.
- Keep human-readable scoring explanations for admin review.

## Priority 6: AI Compliance Document Review

Use AI as a pre-screening layer, not as final authority.

AI should flag:

- Expired license.
- Mismatched driver name.
- Missing insurance fields.
- Wrong document type.
- Unreadable/blurred image.
- Vehicle plate mismatch.
- VIN mismatch.
- Permit expiration date.
- Missing commercial/TNC coverage language.

Document statuses:

```ts
DOCUMENT_UPLOADED
AI_REVIEW_PENDING
AI_REVIEW_FLAGGED
ADMIN_APPROVED
ADMIN_REJECTED
EXPIRED
```

Admin review should show:

- Extracted fields.
- Confidence score.
- Flags.
- Original image/PDF.
- Prior submission history.
- Approval/rejection reason.
- Audit trail.

## Priority 7: AI Risk Scoring

Before ride acceptance, escrow release, refund, or dispute resolution, calculate risk.

Signals:

- New account.
- Wallet/device/location mismatch.
- Repeated cancellations.
- Rider disputes.
- Driver disputes.
- Abnormal pickup/dropoff pattern.
- Multiple accounts using the same device.
- Unusually high-value ride.
- Repeated failed payments.
- Rapid ride creation attempts.
- VPN/proxy or impossible travel.

Actions:

- Require extra verification.
- Delay escrow release.
- Freeze escrow for manual review.
- Alert admin.
- Temporarily restrict account.
- Require support review before next ride.

Risk states:

- `LOW`
- `MEDIUM`
- `HIGH`
- `MANUAL_REVIEW`
- `RESTRICTED`

## Priority 8: Account Abstraction For Normal Users

Most riders should not need to understand MetaMask. Account abstraction should make Web3 invisible unless the user wants advanced control.

Build:

- Email/social login.
- Embedded wallet.
- Sponsored gas.
- USDC-only payment mode.
- Session keys for low-risk actions.
- Recovery options.
- Web2 mode.
- Web3 advanced mode.

Rider copy should say:

- "Secure payment."
- "Refundable ride hold."
- "Protected by escrow."

Avoid making mainstream riders think about wallets, gas, RPCs, chain IDs, or token approvals.

## Priority 9: ADA + Accessibility

Accessibility is a product, compliance, and market-expansion requirement. Orlando tourism includes wheelchair users, families, older travelers, and convention visitors.

Add:

- Wheelchair-accessible vehicle category.
- Accessibility filters in ride request.
- Service-animal-friendly driver flag.
- Child seat option.
- Extra luggage option.
- Mobility assistance notes.
- Driver accessibility training credential.
- Admin reporting for accessibility ride fulfillment.

Risk to flag:

- Do not launch broad public transportation claims without legal review of ADA obligations and accessible service availability.

## Priority 10: Tourist Mode AI Assistant

This is a strong differentiator for Orlando.

Examples:

- "Find me a ride to Disney with a child seat."
- "I need airport pickup for 5 people and 6 bags."
- "Book a driver from MCO to Universal."
- "Find a Spanish-speaking driver."
- "I need a wheelchair accessible van."
- "Estimate cost from MCO to Lake Buena Vista."

Assistant should understand:

- MCO airport.
- Disney Springs.
- Universal.
- International Drive.
- Lake Buena Vista.
- Convention Center.
- Cruise/Port Canaveral transfer intent.
- Vehicle capacity.
- Luggage needs.
- Language preference.
- Child-seat/accessibility needs.

## Priority 11: Multi-Language Support

Localization should cover the rider app, driver app, document upload, and support/dispute flows.

Initial languages:

- English.
- Spanish.
- Portuguese.
- Haitian Creole.

High-value localized surfaces:

- Driver onboarding.
- Compliance document upload.
- Rejection reasons.
- Rider booking.
- Fare breakdown.
- Payment/escrow explanations.
- Safety/SOS.
- Disputes.

## Priority 12: Driver AI Copilot

Give drivers help earning more while staying compliant.

Features:

- Best areas to go online.
- Airport queue/staging recommendations.
- Expected demand zones.
- Ride acceptance recommendations.
- Daily earnings summary.
- Tax/export report.
- Safety reminders.
- Compliance reminders.
- Suggested schedule.

Example:

> Demand is rising near MCO and International Drive. You are airport-eligible, so going online near the approved staging area may increase your ride offers.

## Priority 13: Safety + SOS

Make safety production-grade before public riders.

Add:

- Live trip sharing.
- Emergency contact.
- Panic button.
- Driver/rider identity verification badge.
- Trip PIN verification.
- Incident upload.
- Real-time admin alert.
- Location heartbeat during active ride.
- Safety timeline for every active trip.
- Retention rules for sensitive incident data.

## Priority 14: Dispute Resolution Center

Escrow makes disputes central. The workflow needs clear time bounds.

Suggested SLA:

- Dispute window: 24 hours after ride completion.
- Evidence submission window: 48 hours.
- Admin decision target: 72 hours.
- Auto-release if no admin action within 5 days, unless legally escalated.

Workflow:

```txt
Ride completed
→ release pending
→ dispute window opens
→ no dispute: auto-release
→ dispute filed: escrow frozen
→ evidence submitted
→ admin/arbiter review
→ release/refund/split decision
```

Evidence:

- GPS route.
- Pickup/dropoff timestamps.
- Chat messages.
- Rider/driver statements.
- Document verification status.
- Payment transaction hash.
- Admin notes.

## Priority 15: Reputation Credentials

Use Web3 for trust, not speculative collectibles.

Credential examples:

- Verified Driver Badge.
- Airport Eligible Driver Badge.
- 100 Completed Rides Badge.
- Five-Star Driver Badge.
- Verified Rider Badge.
- No-Dispute History Badge.
- Safety Certified Badge.
- WAV/Accessibility Certified Badge.

Recommendation:

- Make these non-transferable or soulbound.
- Keep sensitive data off-chain.
- Store only credential proofs or attestations on-chain.

## Priority 16: Driver Bond / Security Deposit

Be careful with staking language. A yield-bearing stake or slashable token system can raise money-transmission, consumer-protection, and securities questions.

Safer first version:

- Optional refundable driver security deposit.
- Held in escrow, not yield-bearing.
- Clear written conditions.
- No token appreciation promise.
- Human-reviewed forfeiture only after dispute process.
- Legal review before launch.

Avoid:

- "Earn yield."
- "Stake to profit."
- Automatic slashing without due process.
- Platform-token incentives before counsel review.

## Priority 17: Admin Command Center

Admin operations need a serious dashboard before launch.

Admin needs:

- Live ride map.
- Active escrows.
- Stuck payments.
- Pending driver approvals.
- Document review queue.
- Flagged users.
- Disputes.
- Airport permit status.
- Revenue dashboard.
- WebSocket health.
- Failed transaction logs.
- Manual refund/release tools.
- Audit log for every admin action.
- Admin RBAC.

Every admin action should record:

- Admin user.
- Action.
- Target user/ride/payment/document.
- Before/after values.
- Reason.
- Timestamp.
- IP/device metadata where appropriate.

## Priority 18: Privacy, CCPA, And Data Retention

Libre Ride collects sensitive data: GPS location, identity documents, wallet addresses, device metadata, trip history, and potentially biometrics-adjacent images.

Add a data classification matrix:

| Data Type | Sensitivity | Retention | Access |
| --- | --- | --- | --- |
| GPS route | High | Limited | Rider, driver, admin |
| Driver license | Very high | Compliance period + legal hold | Compliance admins only |
| Insurance docs | High | Policy period + legal hold | Compliance admins only |
| Wallet address | Medium | Account lifetime | User/admin |
| Payment tx hash | Medium | Financial record period | User/admin |
| Chat/support messages | High | Support retention window | Support/admin |
| Incident evidence | Very high | Legal/security policy | Restricted admins |

Build:

- Data export request flow.
- Data deletion/deactivation flow.
- Retention jobs.
- Role-based access.
- PII masking in logs.
- Secrets scanner in CI.

## Priority 19: Cold-Start Launch Strategy

Do not launch citywide first. Local marketplaces fail when supply and demand are too thin.

Recommended wedge:

1. Launch one corridor: MCO to International Drive / Convention Center.
2. Recruit 20-30 verified drivers manually.
3. Focus on airport, tourist, and private transfer rides.
4. Require complete compliance before public matching.
5. Add Spanish/Portuguese driver support early.
6. Use concierge/manual dispatch fallback while the marketplace learns.
7. Expand to Disney/Universal/Lake Buena Vista once completion and retention metrics are healthy.

Key metrics:

- Driver onboarding completion rate.
- Time to approval.
- Driver online hours.
- Rider request to accepted time.
- Pickup ETA accuracy.
- Completion rate.
- Dispute rate.
- Payment failure rate.
- Airport ride success rate.

## Priority 20: Production Security Must-Haves

Before real users and real money:

- Rate limiting.
- Zod request validation everywhere.
- CSRF/session review.
- JWT/session expiry rules.
- WebSocket auth and room authorization.
- Replay protection for escrow confirmations.
- Idempotency keys for payment endpoints.
- Transaction hash uniqueness.
- Database constraints for ride/payment state.
- Audit logs.
- Contract event listener validation.
- Admin RBAC.
- Secrets scanner in CI.
- Dependency audit in CI.
- Smart contract audit.
- Payment/release/refund/dispute test suite.

## Production Readiness Acceptance Criteria

The platform should not be considered production-ready until all of the following are true:

- Real USDC escrow deposit, release, refund, and dispute flows are tested on Base Sepolia.
- Escrow contract address is deployed, verified, and stored through production environment variables.
- PostgreSQL production database is connected and migration-tested.
- Firebase/Auth production configuration is validated.
- Persona/KYC production flow is tested with approved and rejected driver cases.
- Document upload storage is tested with production bucket permissions.
- Admin can approve, suspend, and reject drivers.
- Every payment endpoint has idempotency protection.
- Every escrow transaction is tied to a unique ride ID and transaction hash.
- WebSocket events are authorized by user role and ride membership.
- Rate limiting and request validation are active on all public APIs.
- Production CI runs check, test, build, and E2E smoke tests.
- At least one full staging ride is completed using real wallet signing.
- No real funds are accepted until smart contract review is complete.
- Insurance coverage requirements are approved by counsel before public driver onboarding.
- Toll estimates are itemized for toll-road routes.
- Accessibility ride categories and service policies are documented before broad public launch.
- Privacy/data-retention policy is approved before collecting production identity documents.

## Suggested Build Order

1. Real USDC escrow wallet flow.
2. Production database + deployed contract validation.
3. Driver compliance/KYC/admin approval.
4. Insurance coverage gate.
5. Toll-aware fare estimator.
6. AI dispatch/smart matching.
7. AI fraud/risk scoring.
8. Dispute center.
9. MCO/airport eligibility workflow.
10. Account abstraction / embedded wallet.
11. ADA/accessibility ride categories.
12. Driver/rider reputation credentials.
13. Tourist AI assistant.
14. Driver AI copilot.
15. Multi-language rollout.

## Sources To Track

- City of Orlando Vehicle for Hire / transportation company requirements: https://www.orlando.gov/Public-Safety/OPD/Start-a-Transportation-Company
- Florida TNC insurance statute reference: https://www.flsenate.gov/laws/statutes/2018/627.748
- SunPass toll calculator and Florida toll-road planning: https://www.sunpass.com/en/tolls/tollsSunPass.shtml
- Orlando/MCO rideshare enforcement context: https://www.fox35orlando.com/news/orlando-international-airport-cracking-down-unpermitted-drivers-picking-up-passengers-cheap-rides
- Ethereum/Web3 account abstraction/user ownership context: https://ethereum.org/web3/
