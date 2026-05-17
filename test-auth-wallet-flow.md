# End-to-End Auth → Wallet → DB Flow Test

This document provides a step-by-step test plan to validate the complete authentication and wallet linking flow with database persistence.

## Prerequisites

- ✅ Server running (`npm run dev`)
- ✅ Database connected (Neon PostgreSQL)
- ✅ Firebase configured (Google login working)
- ✅ Browser with MetaMask or another Web3 wallet installed

---

## Test Flow Overview

1. **Google Social Login** → Creates user in PostgreSQL
2. **Get Wallet Nonce** → Stores nonce in `wallet_link_nonces` table
3. **Sign Message with Wallet** → User signs nonce message
4. **Link Wallet** → Verifies signature, links wallet, clears nonce
5. **Verify Persistence** → Restart server, confirm data persists

---

## Step 1: Google Social Login

### Expected Behavior
- User clicks "Continue with Google"
- Firebase popup appears
- User authenticates
- Backend creates user row in `users` table

### Verification

**In Browser DevTools Console:**
```javascript
// After Google login, check localStorage
localStorage.getItem('userId')
// Should return a UUID

// Check Firebase auth
// Should see Firebase user object
```

**In Database (via Neon Console or psql):**
```sql
SELECT id, firebase_uid, email, wallet_address, wallet_verified_at, created_at
FROM users
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- ✅ `firebase_uid` populated (from Firebase)
- ✅ `email` populated (from Google account)
- ✅ `wallet_address` is NULL (not linked yet)
- ✅ `wallet_verified_at` is NULL
- ✅ `created_at` is recent timestamp

---

## Step 2: Get Wallet Nonce

### API Call
```bash
# Get Firebase ID token from browser localStorage or DevTools
# Then call:

curl -X POST http://localhost:5000/api/wallet/nonce \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -v
```

### Expected Response
```json
{
  "nonce": "a1b2c3d4e5f6...",
  "message": "Sign this message to link your wallet to Libre RideShare.\n\nNonce: a1b2c3d4e5f6...\nFirebase UID: abc123...",
  "expiresAt": "2026-01-07T11:45:00.000Z"
}
```

### Verification

**In Database:**
```sql
SELECT firebase_uid, nonce, expires_at
FROM wallet_link_nonces
WHERE firebase_uid = 'YOUR_FIREBASE_UID';
```

**Expected Result:**
- ✅ Row exists with `firebase_uid`
- ✅ `nonce` matches response
- ✅ `expires_at` is ~10 minutes in future

---

## Step 3: Sign Message with Wallet

### Frontend Code (Browser Console)
```javascript
// Connect wallet (MetaMask)
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
const walletAddress = accounts[0];

// Get nonce from Step 2
const nonceResponse = await fetch('/api/wallet/nonce', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,
    'Content-Type': 'application/json'
  }
});
const { nonce, message } = await nonceResponse.json();

// Sign message
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [message, walletAddress]
});

console.log('Signature:', signature);
```

### Expected Result
- ✅ MetaMask popup appears
- ✅ User approves signature
- ✅ `signature` is a hex string starting with `0x`

---

## Step 4: Link Wallet

### API Call
```bash
curl -X POST http://localhost:5000/api/wallet/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "signature": "0x1234...",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }' \
  -v
```

### Expected Response
```json
{
  "success": true,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "walletVerifiedAt": "2026-01-07T11:45:30.000Z"
}
```

### Verification

**In Database:**
```sql
-- Check user table
SELECT id, firebase_uid, wallet_address, wallet_verified_at
FROM users
WHERE firebase_uid = 'YOUR_FIREBASE_UID';

-- Check nonce is cleared
SELECT * FROM wallet_link_nonces
WHERE firebase_uid = 'YOUR_FIREBASE_UID';
-- Should return 0 rows
```

**Expected Result:**
- ✅ `wallet_address` populated
- ✅ `wallet_verified_at` is recent timestamp
- ✅ Nonce row deleted from `wallet_link_nonces`

---

## Step 5: Verify Persistence (Server Restart)

### Test
1. **Stop server** (Ctrl+C)
2. **Restart server** (`npm run dev`)
3. **Check wallet status**

### API Call
```bash
curl -X GET http://localhost:5000/api/wallet/status \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -v
```

### Expected Response
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isLinked": true,
  "walletVerifiedAt": "2026-01-07T11:45:30.000Z"
}
```

### Verification

**In Database:**
```sql
SELECT * FROM users WHERE firebase_uid = 'YOUR_FIREBASE_UID';
```

**Expected Result:**
- ✅ All data persists after restart
- ✅ `wallet_address` still populated
- ✅ `wallet_verified_at` unchanged

---

## Error Cases to Test

### 1. Expired Nonce
- Wait 10+ minutes after generating nonce
- Try to link wallet
- **Expected:** `400 Nonce expired or not found`

### 2. Invalid Signature
- Use wrong signature (from different message)
- **Expected:** `400 Invalid signature`

### 3. Wallet Already Linked
- Try to link same wallet twice
- **Expected:** `400 Wallet already linked`

### 4. Wallet Linked to Another Account
- Link wallet to User A
- Try to link same wallet to User B
- **Expected:** `400 Wallet already linked to another account`

### 5. No Firebase Auth
- Call `/api/wallet/nonce` without Authorization header
- **Expected:** `401 Unauthorized`

---

## Success Criteria

✅ **All steps pass**
✅ **Data persists in PostgreSQL**
✅ **Nonces expire correctly**
✅ **Signature verification works**
✅ **Wallet reuse prevented**
✅ **Data survives server restart**

---

## Quick Test Script (Node.js)

Save as `test-wallet-flow.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
// Or use direct PostgreSQL client
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testFlow() {
  // 1. Check user exists
  const userResult = await pool.query(
    'SELECT * FROM users WHERE firebase_uid = $1',
    ['YOUR_FIREBASE_UID']
  );
  console.log('User:', userResult.rows[0]);

  // 2. Check nonce exists (before linking)
  const nonceResult = await pool.query(
    'SELECT * FROM wallet_link_nonces WHERE firebase_uid = $1',
    ['YOUR_FIREBASE_UID']
  );
  console.log('Nonce:', nonceResult.rows[0]);

  // 3. Check wallet linked (after linking)
  const walletResult = await pool.query(
    'SELECT wallet_address, wallet_verified_at FROM users WHERE firebase_uid = $1',
    ['YOUR_FIREBASE_UID']
  );
  console.log('Wallet:', walletResult.rows[0]);
}

testFlow();
```

---

## Next Steps After This Test

Once this flow is validated:
1. ✅ Implement SIWE (Sign-In With Ethereum) hybrid auth
2. ✅ Add frontend wallet linking UI
3. ✅ Test escrow event indexing
4. ✅ Build admin dashboard
5. ✅ Deploy to staging

