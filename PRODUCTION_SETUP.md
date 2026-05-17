# Production Setup Guide

This guide covers the production hardening steps for Libre RideShare DApp.

## ✅ What's Been Implemented

### 1. Production Hardening ✅

#### Firebase Admin SDK
- **Location**: `server/lib/firebase/admin.ts`
- **Behavior**:
  - Production: Fails hard if misconfigured (throws error on startup)
  - Development: Falls back to dev mode with warning
- **Required Env Vars**:
  ```env
  FIREBASE_ADMIN_PROJECT_ID=libre-dev-e77b2
  FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@libre-dev-e77b2.iam.gserviceaccount.com
  FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  ```

#### Auth Middleware
- **Location**: `server/middleware/auth.ts`
- **Features**:
  - `requireAuth`: Verifies Firebase ID tokens on every request
  - `optionalAuth`: Attaches user if token present, but doesn't require it
  - `requireRole`: Role-based access control
- **Security**: Never trusts client-provided `userId`. Always extracts from verified token.

#### Updated Routes
- **`/api/user/profile`**: Now uses `requireAuth` middleware (no query params)
- **`/api/auth/social-login`**: Stores `firebaseUid` and verifies tokens properly

### 2. Wallet ↔ Firebase Linking ✅

#### Endpoints
- **`POST /api/wallet/nonce`**: Generate nonce for wallet linking
- **`POST /api/wallet/link`**: Link wallet via signature verification
- **`GET /api/wallet/status`**: Get wallet linking status

#### Flow
1. User logs in via Firebase (has `firebaseUid`)
2. Backend generates nonce bound to `firebaseUid`
3. User signs nonce with wallet
4. Backend verifies signature
5. Wallet address linked to user profile

#### Security
- Nonce expires after 10 minutes
- Prevents wallet reuse across accounts
- Stores `walletVerifiedAt` timestamp

### 3. Driver Verification Flow ✅

#### Endpoints
- **`POST /api/driver/onboard`**: Start driver onboarding
- **`POST /api/driver/documents`**: Upload license & insurance
- **`GET /api/driver/status`**: Get driver verification status
- **`POST /api/driver/admin/approve`**: Admin approval (admin role required)
- **`POST /api/driver/admin/reject`**: Admin rejection (admin role required)

#### Requirements
- Firebase-verified identity (`identityVerified: true`)
- Linked wallet (`walletAddress` + `walletVerifiedAt`)
- Uploaded documents (license, insurance)
- Admin approval

#### Driver Status Flow
```
unverified → pending → approved/rejected
```

### 4. Smart Contract Escrow ✅

#### Contract
- **Location**: `contracts/RideEscrow.sol`
- **Features**:
  - Rider deposits funds
  - Funds locked during ride
  - Release on completion
  - Refund on cancellation/timeout
  - Platform fee support (configurable)
  - Emergency arbitration hook (future DAO)

#### Backend Integration
- **Location**: `server/routes/escrow.ts`
- **Endpoints**:
  - `POST /api/escrow/create`: Create escrow metadata
  - `POST /api/escrow/confirm`: Confirm on-chain escrow creation
  - `POST /api/escrow/complete`: Mark escrow as completed
  - `POST /api/escrow/refund`: Mark escrow as refunded
  - `GET /api/escrow/status/:rideId`: Get escrow status

#### Escrow Flow
1. Rider requests ride → Frontend calls `/api/escrow/create`
2. Frontend calls `contract.createRideEscrow()` on-chain
3. Frontend calls `/api/escrow/confirm` with `txHash`
4. Ride completes → Frontend calls `contract.completeRide()` on-chain
5. Frontend calls `/api/escrow/complete` with `txHash`

## 🔧 Database Schema Updates

### Users Table
```sql
firebaseUid TEXT UNIQUE          -- Primary auth identifier
walletAddress TEXT UNIQUE
walletVerifiedAt TIMESTAMP
identityVerified BOOLEAN
identityVerifiedAt TIMESTAMP
authProvider TEXT                -- "email" | "google" | "apple"
```

### Drivers Table
```sql
driverStatus TEXT                -- "unverified" | "pending" | "approved" | "rejected"
driverApprovedAt TIMESTAMP
driverRejectedAt TIMESTAMP
rejectionReason TEXT
```

### Rides Table
```sql
escrowId TEXT
escrowAddress TEXT
escrowStatus TEXT                -- "pending" | "locked" | "released" | "refunded"
escrowAmount REAL
escrowTxHash TEXT
escrowReleaseTxHash TEXT
```

## 🚀 Deployment Checklist

### Environment Variables

#### Client (`.env` in `client/`)
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

#### Server (`.env` in root)
```env
# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="..."

# Escrow Contract
ESCROW_CONTRACT_ADDRESS=0x...

# Other
NODE_ENV=production
PORT=5000
```

### Pre-Deployment Steps

1. **Configure Firebase Admin**
   - Download service account JSON from Firebase Console
   - Extract `project_id`, `client_email`, `private_key`
   - Add to `.env` (keep `\n` in private key)

2. **Deploy Escrow Contract**
   - Compile: `npx hardhat compile` (if using Hardhat)
   - Deploy to Base Sepolia (or mainnet)
   - Set `ESCROW_CONTRACT_ADDRESS` in `.env`

3. **Update Storage Implementation**
   - Replace `MemStorage` with `DrizzleStorage` (Postgres/SQLite)
   - Run migrations for schema updates

4. **Test Auth Flow**
   - Verify Firebase Admin initializes (check logs)
   - Test social login → profile fetch
   - Verify `firebaseUid` is stored correctly

5. **Test Wallet Linking**
   - Generate nonce
   - Sign with wallet
   - Verify linking succeeds

6. **Test Driver Verification**
   - Complete identity verification
   - Link wallet
   - Start driver onboarding
   - Upload documents
   - Admin approval

7. **Test Escrow**
   - Create ride
   - Create escrow on-chain
   - Complete ride
   - Verify funds released

## 🔒 Security Notes

1. **Never trust client-provided `userId`**
   - Always extract from verified Firebase token
   - Use `requireAuth` middleware on all protected routes

2. **Wallet Linking**
   - Nonces expire after 10 minutes
   - Signature verification prevents wallet reuse
   - Store `walletVerifiedAt` for audit trail

3. **Driver Verification**
   - Require identity verification before onboarding
   - Require linked wallet before onboarding
   - Admin approval required for all drivers

4. **Escrow**
   - Always validate on-chain state before releasing
   - Store transaction hashes for audit trail
   - Support emergency arbitration (future DAO)

## 📝 Next Steps

1. **Replace MemStorage with Persistent DB**
   - Implement `DrizzleStorage` with Postgres
   - Run migrations for schema updates
   - Test all CRUD operations

2. **Implement Signature Verification**
   - Add `ethers.js` or `viem` to wallet routes
   - Verify EIP-191 signatures properly
   - Test wallet linking end-to-end

3. **Add Admin Dashboard**
   - Driver approval/rejection UI
   - Escrow monitoring
   - User management

4. **Add Frontend Hooks**
   - `useWalletLink` hook
   - `useDriverVerification` hook
   - `useEscrow` hook

5. **Production Monitoring**
   - Add error tracking (Sentry)
   - Add analytics (PostHog)
   - Add logging (Winston/Pino)

## ✅ Testing Checklist

- [ ] Firebase Admin initializes in production
- [ ] Social login stores `firebaseUid`
- [ ] Profile fetch uses `requireAuth` (no query params)
- [ ] Wallet nonce generation works
- [ ] Wallet linking works (signature verification)
- [ ] Driver onboarding requires identity + wallet
- [ ] Document upload works
- [ ] Admin approval works
- [ ] Escrow creation works
- [ ] Escrow completion works
- [ ] Escrow refund works

---

**Status**: All core infrastructure implemented ✅  
**Next**: Replace MemStorage with persistent DB, add frontend hooks, deploy to production

