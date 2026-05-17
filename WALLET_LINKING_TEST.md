# Wallet Linking Test Guide

## Current Status ✅

- ✅ Google login working
- ✅ User created in PostgreSQL
- ✅ Firebase UID stored: `8dHpGeYC5EgH7kOabXZPBo2J4Es1`
- ✅ AA wallet created: `0x58434f179456d45cdb61d950bd8df64715bf1f63`
- ⏳ Wallet linking (signature verification) - **Next to test**

---

## Test Wallet Linking Flow

### Step 1: Get Firebase ID Token

In browser console (after Google login):

```javascript
// Get Firebase ID token
const auth = getAuth();
const user = auth.currentUser;
if (user) {
  const idToken = await user.getIdToken();
  console.log('ID Token:', idToken);
  // Copy this token for API calls
}
```

Or use the Firebase auth state:

```javascript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
const user = auth.currentUser;
const idToken = await user.getIdToken();
```

---

### Step 2: Get Wallet Nonce

**API Call:**
```bash
curl -X POST http://localhost:5000/api/wallet/nonce \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -v
```

**Expected Response:**
```json
{
  "nonce": "a1b2c3d4e5f6...",
  "message": "Sign this message to link your wallet to Libre RideShare.\n\nNonce: a1b2c3d4e5f6...\nFirebase UID: 8dHpGeYC5EgH7kOabXZPBo2J4Es1",
  "expiresAt": "2026-01-07T16:15:00.000Z"
}
```

**Verify in Database:**
```bash
npm run test:db 8dHpGeYC5EgH7kOabXZPBo2J4Es1
```

Should show a nonce in `wallet_link_nonces` table.

---

### Step 3: Sign Message with Wallet

**In Browser Console (with MetaMask or another wallet):**

```javascript
// Connect wallet
const accounts = await window.ethereum.request({ 
  method: 'eth_requestAccounts' 
});
const walletAddress = accounts[0];
console.log('Wallet:', walletAddress);

// Get nonce from Step 2
const nonceResponse = await fetch('/api/wallet/nonce', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
const { nonce, message } = await nonceResponse.json();
console.log('Message to sign:', message);

// Sign message
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [message, walletAddress]
});
console.log('Signature:', signature);
```

**Expected:**
- MetaMask popup appears
- User approves signature
- Signature is a hex string starting with `0x`

---

### Step 4: Link Wallet

**API Call:**
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

**Expected Response:**
```json
{
  "success": true,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "walletVerifiedAt": "2026-01-07T16:15:30.000Z"
}
```

**Verify in Database:**
```bash
npm run test:db 8dHpGeYC5EgH7kOabXZPBo2J4Es1
```

Should show:
- ✅ `wallet_address` updated to new wallet
- ✅ `wallet_verified_at` populated
- ✅ Nonce cleared from `wallet_link_nonces`

---

### Step 5: Check Wallet Status

**API Call:**
```bash
curl -X GET http://localhost:5000/api/wallet/status \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -v
```

**Expected Response:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isLinked": true,
  "walletVerifiedAt": "2026-01-07T16:15:30.000Z"
}
```

---

## Quick Test Script (Browser Console)

Copy-paste this into your browser console after Google login:

```javascript
(async () => {
  // 1. Get Firebase ID token
  const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    console.error('Not logged in');
    return;
  }
  const idToken = await user.getIdToken();
  console.log('✅ ID Token obtained');

  // 2. Get nonce
  const nonceRes = await fetch('/api/wallet/nonce', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });
  const { nonce, message } = await nonceRes.json();
  console.log('✅ Nonce obtained:', nonce.substring(0, 16) + '...');
  console.log('📝 Message to sign:', message);

  // 3. Connect wallet and sign
  if (!window.ethereum) {
    console.error('❌ MetaMask not installed');
    return;
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const walletAddress = accounts[0];
  console.log('✅ Wallet connected:', walletAddress);

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, walletAddress]
  });
  console.log('✅ Message signed:', signature.substring(0, 20) + '...');

  // 4. Link wallet
  const linkRes = await fetch('/api/wallet/link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ signature, walletAddress })
  });
  const result = await linkRes.json();
  console.log('✅ Wallet linked:', result);

  // 5. Check status
  const statusRes = await fetch('/api/wallet/status', {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  const status = await statusRes.json();
  console.log('✅ Final status:', status);
})();
```

---

## Expected Database State After Linking

```sql
SELECT id, firebase_uid, email, wallet_address, wallet_verified_at
FROM users
WHERE firebase_uid = '8dHpGeYC5EgH7kOabXZPBo2J4Es1';
```

Should show:
- `wallet_address`: Your MetaMask address (not AA wallet)
- `wallet_verified_at`: Recent timestamp
- Nonce table: Empty (nonce cleared)

---

## Error Cases to Test

1. **Expired Nonce**: Wait 10+ minutes, then try to link
2. **Invalid Signature**: Use wrong signature
3. **Wallet Already Linked**: Try linking same wallet twice
4. **No Auth**: Call without Authorization header

---

## Success Criteria

✅ Nonce generated and stored in database  
✅ Signature verification succeeds  
✅ Wallet address updated in `users` table  
✅ `wallet_verified_at` timestamp set  
✅ Nonce cleared after linking  
✅ `/api/wallet/status` returns correct state  
✅ Data persists after server restart

