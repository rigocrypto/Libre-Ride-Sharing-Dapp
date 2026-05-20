# LIBRE Staging QA Plan

This plan captures manual staging checks that prove payment, auth, and ride-state behavior against realistic infrastructure before an Orlando pilot.

## TICKET-025 Live Two-Wallet Base Sepolia Proof

### Goal

Prove that a real rider wallet can lock escrow on Base Sepolia and only the assigned, approved, wallet-verified, SIWE-authenticated driver wallet can start the ride.

### Wallets And Evidence

Record these values during the run:

```txt
Rider wallet:
Driver wallet:
Driver database ID:
Ride ID:
Escrow contract:
USDC/mock USDC token:
Chain ID:
Deposit transaction hash:
Escrow status before start:
Escrow status after start:
Start ride response:
Wrong driver response:
Wrong wallet response:
Escrow-not-locked response:
```

### Environment Requirements

- MetaMask is configured for Base Sepolia, chain ID `84532`.
- Rider wallet has Base Sepolia ETH for gas.
- Rider wallet has test USDC or MockUSDC.
- Driver wallet has Base Sepolia ETH for gas.
- Driver account is present in the database.
- Driver account role is `driver`.
- Driver account is approved for rides.
- Driver wallet address is registered in the database.
- Driver wallet is wallet-verified.
- Driver has completed SIWE authentication.
- `ESCROW_CONTRACT_ADDRESS` matches the deployed Base Sepolia escrow contract.
- `VITE_ESCROW_CONTRACT_ADDRESS` matches the same escrow contract.
- `USDC_TOKEN_ADDRESS` and `VITE_USDC_TOKEN_ADDRESS` match the test token used by the rider.
- Backend live run uses `ESCROW_VERIFIER_MODE=viem`.
- `RPC_URL_BASE_SEPOLIA` points to a working Base Sepolia RPC.
- Playwright smoke tests remain isolated with `ESCROW_VERIFIER_MODE=mock` in `playwright.config.ts`.

### Happy Path Steps

1. Start the app with live verifier environment values loaded.
2. Sign in or seed/register the rider with Wallet A.
3. Sign in or seed/register the approved driver with Wallet B.
4. Connect Wallet A in the rider UI.
5. Rider creates a ride.
6. Rider initiates USDC escrow deposit.
7. Rider signs the approval transaction if allowance is insufficient.
8. Rider signs the deposit transaction.
9. Wait for the Base Sepolia deposit receipt to confirm with status `success`.
10. Backend verifies the deposit transaction.
11. Confirm ride escrow status becomes `locked`.
12. Connect Wallet B in the driver UI.
13. Driver accepts the ride.
14. Driver starts the ride.
15. Confirm ride status becomes `IN_PROGRESS`.

### Negative Guard Checks

Run each check against a controlled ride and confirm failed attempts do not mutate ride status.

| Scenario | Expected Result |
| --- | --- |
| Unauthenticated driver calls accept/start | `401 Unauthorized` |
| Driver without wallet verification calls accept | `403 Driver is not approved or wallet verified` |
| Driver without SIWE calls accept/start | `401` or `403` from auth middleware |
| Unapproved driver calls accept | `403 Driver is not approved or wallet verified` |
| Wrong authenticated driver calls start | `403 Not the assigned driver` |
| Assigned driver ID with wrong wallet calls start | `403 Not the assigned driver` |
| Assigned driver calls start before ride is `ACCEPTED` | `409 Ride cannot be started from status: <status>` |
| Assigned driver calls start before escrow is `locked` | `402 Escrow not confirmed` with `code: ESCROW_REQUIRED` |

### Expected Results

- Correct assigned driver wallet can start the escrow-confirmed ride.
- Wrong driver is rejected.
- Wrong wallet is rejected.
- Ride without locked escrow is rejected.
- Failed authorization attempts leave ride status unchanged.
- Failed escrow checks leave ride status unchanged.
- Error messages are clear enough for manual QA to identify the failed guard.
- E2E smoke tests remain deterministic because Playwright forces mock verifier mode.

### Closeout Evidence

Add the final proof to `docs/IMPLEMENTATION_TICKETS.md` before closing TICKET-025:

```txt
Rider wallet:
Driver wallet:
Ride ID:
Deposit tx:
Start response:
Wrong driver response:
Wrong wallet response:
Escrow-not-locked response:
Escrow state path:
Final ride state:
```
