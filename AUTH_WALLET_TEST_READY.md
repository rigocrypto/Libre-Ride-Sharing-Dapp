# ✅ Auth → Wallet → DB Flow: Ready to Test

## What We Just Completed

### 1. ✅ Signature Verification Implementation
- **File:** `server/routes/wallet.ts`
- **Change:** Replaced TODO with proper `viem` signature verification
- **Security:** Now uses EIP-191 message signing with cryptographic verification

### 2. ✅ Test Documentation
- **File:** `test-auth-wallet-flow.md`
- **Contains:** Step-by-step test plan with API calls, database queries, and expected results

### 3. ✅ Database State Checker
- **File:** `scripts/test-db-state.js`
- **Usage:** `npm run test:db [firebaseUid]`
- **Purpose:** Quickly verify user data, nonces, and wallet linking in PostgreSQL

---

## 🧪 How to Run the Test

### Quick Start (5 minutes)

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Open browser and login with Google:**
   - Go to `http://localhost:5000/rider`
   - Click "Continue with Google"
   - Complete authentication

3. **Get your Firebase UID:**
   - Open browser DevTools → Console
   - Run: `localStorage.getItem('firebaseUid')` or check Firebase auth state
   - Copy the UID

4. **Check database state:**
   ```bash
   npm run test:db YOUR_FIREBASE_UID
   ```
   Or without UID to see all recent users:
   ```bash
   npm run test:db
   ```

5. **Test wallet linking (manual):**
   - Follow steps in `test-auth-wallet-flow.md`
   - Or use the browser console script provided in the test doc

---

## 📋 What to Verify

### ✅ After Google Login
- [ ] User row created in `users` table
- [ ] `firebase_uid` populated
- [ ] `email` populated
- [ ] `wallet_address` is NULL (not linked yet)

### ✅ After Getting Nonce
- [ ] Nonce row created in `wallet_link_nonces` table
- [ ] Nonce expires in ~10 minutes
- [ ] Message includes Firebase UID and nonce

### ✅ After Wallet Linking
- [ ] Signature verification succeeds
- [ ] `wallet_address` populated in `users` table
- [ ] `wallet_verified_at` timestamp set
- [ ] Nonce row deleted from `wallet_link_nonces`

### ✅ After Server Restart
- [ ] All data persists
- [ ] `/api/wallet/status` returns correct state
- [ ] No data loss

---

## 🔍 Quick Database Queries

### Check user exists:
```sql
SELECT id, firebase_uid, email, wallet_address, wallet_verified_at
FROM users
WHERE firebase_uid = 'YOUR_FIREBASE_UID';
```

### Check active nonces:
```sql
SELECT firebase_uid, nonce, expires_at
FROM wallet_link_nonces
WHERE firebase_uid = 'YOUR_FIREBASE_UID';
```

### Check wallet uniqueness:
```sql
SELECT wallet_address, COUNT(*) as count
FROM users
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;
```

---

## 🐛 Common Issues & Fixes

### Issue: "Nonce expired or not found"
- **Cause:** Nonce expired (>10 minutes) or server restarted (if using MemStorage)
- **Fix:** Generate a new nonce with `/api/wallet/nonce`

### Issue: "Invalid signature"
- **Cause:** Signature doesn't match message or wallet address
- **Fix:** Ensure you're signing the exact message returned from `/api/wallet/nonce`

### Issue: "Wallet already linked"
- **Cause:** User already has a verified wallet
- **Fix:** Check `/api/wallet/status` first, or unlink wallet if needed

### Issue: Database connection timeout
- **Cause:** Using pooled connection string instead of direct
- **Fix:** Use direct connection string (no `-pooler` in hostname)

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Implement SIWE (Sign-In With Ethereum)**
   - Hybrid auth flow combining Firebase + wallet signatures
   - See `server/routes/siwe.ts` (if exists) or create it

2. **Add Frontend Wallet Linking UI**
   - Create React component for wallet linking flow
   - Integrate with RainbowKit/Wagmi

3. **Test Escrow Event Indexing**
   - Verify on-chain events sync to database
   - Test recovery after server restart

4. **Build Admin Dashboard**
   - User management
   - Driver approvals
   - Ride monitoring

---

## 📚 Files Created/Modified

- ✅ `server/routes/wallet.ts` - Added viem signature verification
- ✅ `test-auth-wallet-flow.md` - Complete test documentation
- ✅ `scripts/test-db-state.js` - Database state checker
- ✅ `package.json` - Added `test:db` script
- ✅ `AUTH_WALLET_TEST_READY.md` - This file

---

## ✅ Success Criteria

You're ready to move forward when:

- ✅ Google login creates user in PostgreSQL
- ✅ Nonce generation stores in database
- ✅ Wallet linking verifies signature correctly
- ✅ Data persists after server restart
- ✅ All error cases handled gracefully

**You're at 80% completion of the core identity model. Once this test passes, you can confidently build the rest of the system.**

