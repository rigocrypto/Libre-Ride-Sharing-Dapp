# Production Readiness Checklist

Libre Ride should be treated as a staging MVP until every gate below is satisfied. This checklist is intentionally strict because the platform touches rides, identity documents, GPS data, insurance, airport compliance, and real USDC escrow.

## Core Go-Live Gates

- [ ] `npm run check` passes in CI.
- [ ] `npm test -- --run` passes in CI.
- [ ] `npm run build` passes in CI.
- [ ] `npm run test:e2e` passes in CI.
- [ ] Production deploy can boot with `NODE_ENV=production`.
- [ ] Production environment variables are documented and validated at startup.
- [ ] No `.env` secrets are committed.
- [ ] CI includes secret scanning and dependency audit.
- [ ] Public Founding Access lead forms persist to production storage and feed CRM/email follow-up.

## Escrow And Payments

- [ ] Escrow contract is deployed to Base Sepolia.
- [ ] Escrow contract source is verified.
- [ ] `ESCROW_CONTRACT_ADDRESS` is set through environment variables.
- [ ] USDC contract address is configured per network.
- [ ] Rider can complete a real wallet-signed deposit on Base Sepolia.
- [ ] Backend verifies escrow deposit from on-chain events, not only client callbacks.
- [ ] Release, refund, and dispute flows are tested on Base Sepolia.
- [ ] Admin escrow monitoring is available for locked, pending, failed, disputed, released, refunded, and stuck deposits.
- [ ] Admin release/refund/dispute workflow enforces allowed escrow transitions and records typed audit logs.
- [ ] Admin audit logs persist to the production database and survive server restarts.
- [ ] Production release/refund actions cannot mutate escrow state without verified on-chain contract execution.
- [ ] Every payment endpoint requires an idempotency key.
- [ ] Transaction hashes are unique in the database.
- [ ] One ride cannot be tied to multiple active escrow deposits.
- [ ] Escrow amount matches the accepted fare quote.
- [ ] No real funds are accepted until smart contract review is complete.

## Database And Persistence

- [ ] PostgreSQL production database is connected.
- [ ] Migrations run cleanly against a staging database.
- [ ] Rollback strategy is documented.
- [ ] Ride/payment state transitions are enforced by database constraints where practical.
- [ ] Escrow records include ride ID, rider ID, driver ID, chain ID, contract address, amount, tx hash, and status.
- [ ] Audit tables exist for admin actions, payment actions, document review, and dispute decisions.

## Auth And Authorization

- [ ] Firebase/Auth production configuration is validated.
- [ ] SIWE verification is validated for production domain and chain ID.
- [ ] Session expiry rules are documented and tested.
- [ ] Wallet linking prevents duplicate wallet ownership across users.
- [ ] WebSocket auth is required before joining any ride-specific channel.
- [ ] WebSocket events are authorized by user role and ride membership.
- [ ] Admin RBAC is implemented.
- [ ] Admin actions require explicit permissions and are audit logged.
- [ ] Admin lead access endpoints require admin authorization.

## Driver Compliance

- [ ] Persona/KYC production flow is tested with approved, rejected, and expired cases.
- [ ] Driver license upload and expiration tracking are live.
- [ ] Admin Driver Compliance dashboard is available behind admin auth.
- [ ] Driver approval, rejection, suspension, and document-request actions require operator reason and audit logs.
- [ ] Dispatch scoring excludes non-approved and expired-document drivers before ride offers are shown.
- [ ] Daily compliance expiration check marks approved drivers with expired documents as `expired_documents`.
- [ ] Orlando permit number/expiration and MCO airport eligibility fields are tracked.
- [ ] Nationwide criminal background check proof is tracked.
- [ ] Vehicle registration and inspection uploads are tracked.
- [ ] Commercial/TNC insurance certificate is required before active rides.
- [ ] MCO/airport eligibility is tracked separately from general driver approval.
- [ ] Expiration alerts fire at 30, 14, 7, and 1 day.
- [ ] Admin can approve, reject, suspend, and reinstate drivers.

## Insurance And Legal

- [ ] Counsel reviews Florida/TNC insurance requirements before public driver onboarding.
- [ ] Personal auto insurance exclusion risk is documented in driver onboarding.
- [ ] Required coverage periods are defined:
  - Period 0: driver offline.
  - Period 1: driver online, no ride accepted.
  - Period 2: ride accepted, en route to pickup.
  - Period 3: rider in vehicle.
- [ ] Commercial/TNC coverage requirements are visible to admin.
- [ ] Insurance expiration blocks affected ride categories.

## Fare, Tolls, And Airport Fees

- [ ] Fare quotes itemize base fare, distance, time, tolls, airport fee, platform fee, and estimated network fee.
- [ ] Toll-road routes include estimated toll costs.
- [ ] MCO/SFB airport pickup/dropoff fees are itemized where applicable.
- [ ] Fare quote has an expiration timestamp.
- [ ] Rider sees what amount is escrowed before payment.

## Safety And Disputes

- [ ] SOS flow is tested end-to-end.
- [ ] Active ride location heartbeat is implemented.
- [ ] Trip PIN verification is implemented or explicitly deferred.
- [ ] Dispute window and SLA are visible to users.
- [ ] Dispute evidence upload is available.
- [ ] Escrow freeze works during disputes.
- [ ] Admin can release, refund, or split escrow after review.

## Privacy And Data Retention

- [ ] Data classification matrix is approved.
- [ ] Identity documents are access-restricted.
- [ ] GPS route retention policy is implemented.
- [ ] Incident evidence retention policy is implemented.
- [ ] PII is masked in logs.
- [ ] Data export/deletion policy is documented.
- [ ] CCPA-style request handling is planned for tourists and out-of-state users.

## Staging Pilot Acceptance

- [ ] At least one full staging ride is completed using real wallet signing.
- [ ] At least one driver approval flow is completed with production-like documents.
- [ ] At least one rejected driver case is tested.
- [ ] At least one escrow refund is tested.
- [ ] At least one escrow dispute is tested.
- [ ] At least one toll-road quote is tested.
- [ ] At least one airport-eligible ride is tested.
- [ ] At least one accessibility-category ride is tested or explicitly deferred before launch.
