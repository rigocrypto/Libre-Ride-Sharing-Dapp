# Escrow Implementation

## ✅ Implementation Complete

Production-ready escrow system with Solidity contract and backend integration. All escrow actions require SIWE verification.

---

## 🏗️ Architecture

```
Ride Created (off-chain)
    ↓
Escrow Deposit (on-chain) ← SIWE Required
    ↓
Ride In Progress
    ↓
Release | Refund | Dispute ← SIWE Required
```

**Key Points:**
- One escrow per ride (identified by `bytes32` rideId hash)
- Simple state machine: `NONE → FUNDED → RELEASED/REFUNDED/DISPUTED`
- Backend validates *when*, contract enforces *money rules*
- All escrow actions require SIWE verification

---

## 📜 Solidity Contract

**Location:** `contracts/RideEscrow.sol`

### State Machine

```solidity
enum State {
    NONE,      // Escrow doesn't exist
    FUNDED,    // Funds deposited, ride in progress
    RELEASED,  // Ride completed, driver paid
    REFUNDED,  // Ride cancelled, rider refunded
    DISPUTED   // Dispute initiated, funds frozen
}
```

### Core Functions

1. **`deposit(bytes32 rideId, address driver, uint256 platformFeeBps)`**
   - Rider deposits funds
   - State → `FUNDED`
   - Emits `Deposited` event

2. **`release(bytes32 rideId)`**
   - Releases funds to driver
   - Deducts platform fee
   - State → `RELEASED`
   - Emits `Released` event

3. **`refund(bytes32 rideId)`**
   - Refunds rider
   - State → `REFUNDED`
   - Emits `Refunded` event

4. **`dispute(bytes32 rideId)`**
   - Freezes funds
   - State → `DISPUTED`
   - Emits `Disputed` event

5. **`resolveDispute(bytes32 rideId, bool releaseToRider)`**
   - Arbitrator resolves dispute
   - Either refunds rider or releases to driver

### Security Features

- ✅ Deposit only once
- ✅ Release only once
- ✅ Refund only if not released
- ✅ No self-dealing (driver ≠ rider)
- ✅ Platform fee capped (max 10%)

---

## 🌐 API Endpoints

All escrow endpoints require:
- ✅ Firebase authentication (`requireAuth`)
- ✅ Verified wallet (`requireWallet`)
- ✅ SIWE verification (`requireSIWE`)

### `POST /api/escrow/deposit`

Prepare escrow deposit (validates ride, returns contract params).

**Request:**
```json
{
  "rideId": "uuid",
  "driverAddress": "0x...",
  "amountWei": "1000000000000000000",
  "platformFeeBps": 300
}
```

**Response:**
```json
{
  "success": true,
  "rideIdHash": "0x...", // bytes32 hash for contract
  "contractAddress": "0x...",
  "amountWei": "1000000000000000000",
  "platformFeeBps": 300,
  "message": "Call contract.deposit(rideIdHash, driverAddress, platformFeeBps) with msg.value = amountWei"
}
```

### `POST /api/escrow/confirm`

Confirm escrow deposit was completed on-chain.

**Request:**
```json
{
  "rideId": "uuid",
  "txHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "escrowStatus": "locked",
  "txHash": "0x..."
}
```

### `POST /api/escrow/release`

Prepare escrow release (validates ride, returns contract params).

**Request:**
```json
{
  "rideId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "rideIdHash": "0x...",
  "contractAddress": "0x...",
  "message": "Call contract.release(rideIdHash) on-chain"
}
```

### `POST /api/escrow/confirm-release`

Confirm escrow release was completed on-chain.

**Request:**
```json
{
  "rideId": "uuid",
  "txHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "escrowStatus": "released",
  "txHash": "0x..."
}
```

### `POST /api/escrow/refund`

Prepare escrow refund (validates ride, returns contract params).

**Request:**
```json
{
  "rideId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "rideIdHash": "0x...",
  "contractAddress": "0x...",
  "message": "Call contract.refund(rideIdHash) on-chain"
}
```

### `POST /api/escrow/confirm-refund`

Confirm escrow refund was completed on-chain.

**Request:**
```json
{
  "rideId": "uuid",
  "txHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "escrowStatus": "refunded",
  "txHash": "0x..."
}
```

### `POST /api/escrow/dispute`

Prepare escrow dispute (validates ride, returns contract params).

**Request:**
```json
{
  "rideId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "rideIdHash": "0x...",
  "contractAddress": "0x...",
  "message": "Call contract.dispute(rideIdHash) on-chain"
}
```

### `GET /api/escrow/status/:rideId`

Get escrow status for a ride.

**Response:**
```json
{
  "rideId": "uuid",
  "escrowId": "0x...",
  "escrowAddress": "0x...",
  "escrowStatus": "locked",
  "escrowAmount": 1.0,
  "escrowTxHash": "0x...",
  "escrowReleaseTxHash": "0x..."
}
```

---

## 🔄 Escrow Flow

### 1. Deposit Flow

```
1. Frontend: POST /api/escrow/deposit
   → Backend validates ride, returns rideIdHash

2. Frontend: contract.deposit(rideIdHash, driverAddress, platformFeeBps)
   → User signs transaction with MetaMask
   → Contract locks funds, emits Deposited event

3. Frontend: POST /api/escrow/confirm { rideId, txHash }
   → Backend stores txHash, marks escrow as "locked"
```

### 2. Release Flow

```
1. Frontend: POST /api/escrow/release
   → Backend validates ride is completed, returns rideIdHash

2. Frontend: contract.release(rideIdHash)
   → User signs transaction
   → Contract releases funds to driver, emits Released event

3. Frontend: POST /api/escrow/confirm-release { rideId, txHash }
   → Backend stores txHash, marks escrow as "released"
```

### 3. Refund Flow

```
1. Frontend: POST /api/escrow/refund
   → Backend validates ride can be refunded, returns rideIdHash

2. Frontend: contract.refund(rideIdHash)
   → User signs transaction
   → Contract refunds rider, emits Refunded event

3. Frontend: POST /api/escrow/confirm-refund { rideId, txHash }
   → Backend stores txHash, marks escrow as "refunded"
```

### 4. Dispute Flow

```
1. Frontend: POST /api/escrow/dispute
   → Backend validates ride, returns rideIdHash

2. Frontend: contract.dispute(rideIdHash)
   → User signs transaction
   → Contract freezes funds, emits Disputed event

3. Admin: contract.resolveDispute(rideIdHash, releaseToRider)
   → Arbitrator resolves dispute
   → Funds released or refunded
```

---

## 🔒 Security

### Authorization Stack

All escrow endpoints use:
```typescript
requireAuth      // Firebase authentication
requireWallet    // Verified wallet
requireSIWE      // SIWE verification
```

This ensures:
- ✅ User identity verified
- ✅ Wallet ownership verified
- ✅ Explicit wallet consent for money movement

### Contract Security

- ✅ State machine prevents invalid transitions
- ✅ Reentrancy protection (simple transfers)
- ✅ Access control (owner, arbitrators)
- ✅ Platform fee capped (max 10%)
- ✅ No self-dealing checks

---

## 🗄️ Database Schema

Escrow fields in `rides` table:

```typescript
escrowId: text              // bytes32 hash (keccak256(rideId))
escrowAddress: text         // Contract address
escrowStatus: text          // "pending" | "locked" | "released" | "refunded"
escrowAmount: real          // Amount in ETH
escrowTxHash: text          // Deposit transaction hash
escrowReleaseTxHash: text   // Release/refund transaction hash
```

---

## 🔧 Environment Variables

```env
# Escrow contract address (required)
ESCROW_CONTRACT_ADDRESS=0x...

# Platform treasury (set in contract constructor)
PLATFORM_TREASURY=0x...

# Default platform fee (basis points, e.g., 300 = 3%)
DEFAULT_PLATFORM_FEE_BPS=300
```

---

## 🚀 Deployment Steps

### 1. Deploy Contract

```bash
# Compile contract
npx hardhat compile

# Deploy to Base Sepolia (testnet)
npx hardhat run scripts/deploy.js --network base-sepolia

# Set ESCROW_CONTRACT_ADDRESS in .env
```

### 2. Configure Contract

```solidity
// Set platform treasury
contract.setPlatformTreasury(PLATFORM_TREASURY);

// Set default platform fee (300 bps = 3%)
contract.setDefaultPlatformFee(300);

// Add arbitrators (optional, for disputes)
contract.addArbitrator(ARBITRATOR_ADDRESS);
```

### 3. Update Backend

```env
ESCROW_CONTRACT_ADDRESS=0x... # From deployment
```

---

## 📝 Event Listening (Future)

Event listener infrastructure can be added to:
- Sync contract state with database
- Detect missed transactions
- Handle dispute resolutions
- Monitor escrow health

**Events to listen for:**
- `Deposited(bytes32 rideId, ...)`
- `Released(bytes32 rideId, ...)`
- `Refunded(bytes32 rideId, ...)`
- `Disputed(bytes32 rideId, ...)`

---

## ✅ Implementation Checklist

- [x] Solidity contract rewritten (bytes32 rideId, simple state machine)
- [x] All escrow routes require SIWE
- [x] Deposit endpoint validates and prepares contract call
- [x] Release endpoint validates and prepares contract call
- [x] Refund endpoint validates and prepares contract call
- [x] Dispute endpoint added
- [x] Status endpoint returns escrow state
- [x] Database schema supports escrow fields
- [x] Security invariants enforced
- [ ] Event listener infrastructure (future)

**Status: ✅ Production-Ready (pending contract deployment)**

---

## 🧪 Testing

### Manual Test Flow

1. **Create Ride**
   ```http
   POST /api/rides
   ```

2. **Prepare Deposit**
   ```http
   POST /api/escrow/deposit
   ```

3. **Call Contract**
   ```javascript
   contract.deposit(rideIdHash, driverAddress, platformFeeBps, { value: amountWei })
   ```

4. **Confirm Deposit**
   ```http
   POST /api/escrow/confirm
   ```

5. **Complete Ride**
   ```http
   PATCH /api/rides/:id { status: "completed" }
   ```

6. **Prepare Release**
   ```http
   POST /api/escrow/release
   ```

7. **Call Contract**
   ```javascript
   contract.release(rideIdHash)
   ```

8. **Confirm Release**
   ```http
   POST /api/escrow/confirm-release
   ```

---

## 📚 References

- [Solidity Documentation](https://docs.soliditylang.org/)
- [EIP-4361: Sign-In With Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [viem Documentation](https://viem.sh/)

