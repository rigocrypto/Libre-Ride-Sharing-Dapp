# Escrow State Machine

Escrow is the financial heart of Libre Ride. Wallet UI, backend APIs, smart contracts, ride state, dispute handling, and admin tools must all use one shared state model.

## Canonical Escrow States

```txt
NO_DEPOSIT
DEPOSIT_INITIATED
DEPOSIT_PENDING_ONCHAIN
DEPOSIT_CONFIRMED
RIDE_ACCEPTED
RIDE_IN_PROGRESS
RELEASE_PENDING
RELEASED
REFUND_PENDING
REFUNDED
DISPUTED
DISPUTE_RESOLVED_RELEASE
DISPUTE_RESOLVED_REFUND
DISPUTE_RESOLVED_SPLIT
FAILED
EXPIRED
```

## State Definitions

| State | Meaning | User-Facing Copy |
| --- | --- | --- |
| `NO_DEPOSIT` | No escrow action has started. | No payment hold yet. |
| `DEPOSIT_INITIATED` | Backend created deposit intent/contract params. | Preparing secure payment. |
| `DEPOSIT_PENDING_ONCHAIN` | Rider signed transaction; waiting for chain confirmation. | Payment is confirming. |
| `DEPOSIT_CONFIRMED` | Backend verified on-chain deposit. | Payment secured. |
| `RIDE_ACCEPTED` | Driver accepted ride and funds are available/expected. | Driver matched. |
| `RIDE_IN_PROGRESS` | Ride started after escrow gate passed. | Trip in progress. |
| `RELEASE_PENDING` | Ride ended; release is waiting for rider/admin/timeout. | Payout pending. |
| `RELEASED` | Driver payout completed. | Payment released. |
| `REFUND_PENDING` | Refund has been requested or triggered. | Refund pending. |
| `REFUNDED` | Rider refund completed. | Refund complete. |
| `DISPUTED` | Escrow is frozen pending review. | Payment paused for review. |
| `DISPUTE_RESOLVED_RELEASE` | Dispute resolved in favor of driver. | Dispute resolved; payment released. |
| `DISPUTE_RESOLVED_REFUND` | Dispute resolved in favor of rider. | Dispute resolved; refund issued. |
| `DISPUTE_RESOLVED_SPLIT` | Dispute resolved with split payout/refund. | Dispute resolved; payment split. |
| `FAILED` | Payment/release/refund failed. | Payment action failed. |
| `EXPIRED` | Deposit intent or release window expired. | Payment window expired. |

## Allowed Transitions

```txt
NO_DEPOSIT
  -> DEPOSIT_INITIATED
  -> EXPIRED

DEPOSIT_INITIATED
  -> DEPOSIT_PENDING_ONCHAIN
  -> FAILED
  -> EXPIRED

DEPOSIT_PENDING_ONCHAIN
  -> DEPOSIT_CONFIRMED
  -> FAILED
  -> EXPIRED

DEPOSIT_CONFIRMED
  -> RIDE_ACCEPTED
  -> REFUND_PENDING
  -> DISPUTED

RIDE_ACCEPTED
  -> RIDE_IN_PROGRESS
  -> REFUND_PENDING
  -> DISPUTED

RIDE_IN_PROGRESS
  -> RELEASE_PENDING
  -> DISPUTED

RELEASE_PENDING
  -> RELEASED
  -> DISPUTED
  -> FAILED

REFUND_PENDING
  -> REFUNDED
  -> DISPUTED
  -> FAILED

DISPUTED
  -> DISPUTE_RESOLVED_RELEASE
  -> DISPUTE_RESOLVED_REFUND
  -> DISPUTE_RESOLVED_SPLIT

DISPUTE_RESOLVED_RELEASE
  -> RELEASED

DISPUTE_RESOLVED_REFUND
  -> REFUNDED

DISPUTE_RESOLVED_SPLIT
  -> RELEASED
  -> REFUNDED
```

## Backend Invariants

- A ride may enter `RIDE_IN_PROGRESS` only after escrow is confirmed or explicitly waived by an admin-only test mode.
- A ride can have only one active escrow record.
- A transaction hash can be used only once.
- Chain ID, contract address, ride ID hash, rider wallet, driver wallet, and amount must match expected values.
- Client callbacks are never sufficient proof of payment.
- Backend must verify on-chain events before marking `DEPOSIT_CONFIRMED`, `RELEASED`, or `REFUNDED`.
- Disputes freeze release/refund actions until resolved.
- Admin overrides require reason, role permission, and audit log entry.

## API Mapping

| API | From | To |
| --- | --- | --- |
| `POST /api/escrow/deposit/initiate` | `NO_DEPOSIT` | `DEPOSIT_INITIATED` |
| Wallet transaction submitted | `DEPOSIT_INITIATED` | `DEPOSIT_PENDING_ONCHAIN` |
| Contract event verified | `DEPOSIT_PENDING_ONCHAIN` | `DEPOSIT_CONFIRMED` |
| Driver accepts ride | `DEPOSIT_CONFIRMED` or `NO_DEPOSIT` test mode | `RIDE_ACCEPTED` |
| Driver starts ride | `RIDE_ACCEPTED` | `RIDE_IN_PROGRESS` |
| Ride completed | `RIDE_IN_PROGRESS` | `RELEASE_PENDING` |
| Release verified | `RELEASE_PENDING` | `RELEASED` |
| Refund requested | `DEPOSIT_CONFIRMED`, `RIDE_ACCEPTED`, `RELEASE_PENDING` | `REFUND_PENDING` |
| Refund verified | `REFUND_PENDING` | `REFUNDED` |
| Dispute filed | `DEPOSIT_CONFIRMED`, `RIDE_ACCEPTED`, `RIDE_IN_PROGRESS`, `RELEASE_PENDING` | `DISPUTED` |
| Admin dispute decision | `DISPUTED` | resolved dispute state |

## UI Mapping

| Escrow State | Rider UI | Driver UI | Admin UI |
| --- | --- | --- | --- |
| `NO_DEPOSIT` | Show payment CTA when driver accepted. | Waiting for payment. | No active payment. |
| `DEPOSIT_PENDING_ONCHAIN` | Payment confirming. | Waiting for payment. | Pending tx. |
| `DEPOSIT_CONFIRMED` | Driver secured. | Start ride enabled. | Escrow locked. |
| `RIDE_IN_PROGRESS` | Trip active. | Trip active. | Active ride. |
| `RELEASE_PENDING` | Release pending/dispute window. | Payout pending. | Release queue. |
| `RELEASED` | Receipt complete. | Earnings credited. | Closed. |
| `DISPUTED` | Dispute under review. | Dispute under review. | Action required. |
| `REFUNDED` | Refund complete. | No payout. | Closed. |
| `FAILED` | Retry/support. | Payment issue. | Failed tx alert. |

## Database Fields Needed

- `escrowStatus`
- `escrowState`
- `escrowId`
- `rideIdHash`
- `chainId`
- `contractAddress`
- `usdcAddress`
- `riderWallet`
- `driverWallet`
- `quotedAmount`
- `escrowAmount`
- `platformFeeBps`
- `depositTxHash`
- `releaseTxHash`
- `refundTxHash`
- `disputeId`
- `stateUpdatedAt`
- `expiresAt`
- `idempotencyKey`

## Test Coverage Required

- Deposit initiate creates one active escrow only.
- Duplicate deposit idempotency returns same result.
- Wrong chain ID is rejected.
- Wrong contract address is rejected.
- Wrong amount is rejected.
- Duplicate transaction hash is rejected.
- Driver cannot start before `DEPOSIT_CONFIRMED`.
- Release cannot happen during `DISPUTED`.
- Refund cannot happen after `RELEASED`.
- Admin split decision records audit log.
- Expired deposit intent cannot be confirmed without re-initiation.

