# Development Identity Bypass Guide

## ✅ Implementation Complete

Your system now has **two clean ways** to bypass identity verification in development:

---

## Option 1: Environment Variable Bypass (Recommended)

**Set in `.env`:**
```env
SKIP_IDENTITY_CHECK=true
```

**How it works:**
- The `requireIdentity` middleware checks this flag
- If `NODE_ENV=development` AND `SKIP_IDENTITY_CHECK=true`, identity check is bypassed
- **No code changes needed** - just restart your server

**Usage:**
```bash
# Add to .env file
SKIP_IDENTITY_CHECK=true

# Restart server
npm run dev
```

✅ **Benefits:**
- Global bypass (all routes)
- No manual steps per user
- Easy to toggle on/off
- Production-safe (only works in dev)

---

## Option 2: Mock Verification Endpoint

**Call the mock endpoint:**
```bash
# Using curl (replace <token> and <userId>)
curl -X POST http://localhost:5000/api/identity/mock-verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<userId>"}'
```

**Or from browser console:**
```js
const token = await (await firebase.auth().currentUser?.getIdToken());
const userId = localStorage.getItem('userId');

fetch('/api/identity/mock-verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ userId })
})
  .then(r => r.json())
  .then(console.log);
```

✅ **Benefits:**
- Per-user verification (more realistic)
- Tests full verification flow
- Can be called multiple times
- Production-safe (disabled in prod)

---

## Which Option to Use?

### Use Option 1 (Env Bypass) when:
- ✅ You're building features that don't depend on verification
- ✅ You want to skip verification entirely during development
- ✅ You need to test ride creation, escrow, etc. without verification

### Use Option 2 (Mock Endpoint) when:
- ✅ You want to test the verification flow itself
- ✅ You need different users with different verification statuses
- ✅ You're testing admin flows that query verification status

---

## Current Authorization Stack

Your routes now enforce this order:

```ts
requireAuth        // Firebase token verified
  ↓
requireWallet      // Wallet linked and verified
  ↓
requireIdentity    // Identity verified (bypassable in dev)
  ↓
Route handler      // Your business logic
```

**Example:** `/api/rides` now requires:
1. ✅ Authenticated (Firebase)
2. ✅ Wallet verified
3. ✅ Identity verified (or bypassed in dev)

---

## Testing

### Test 1: Without Bypass
1. **Don't set `SKIP_IDENTITY_CHECK`**
2. **Don't call mock endpoint**
3. **Try creating a ride:**
   ```bash
   curl -X POST http://localhost:5000/api/rides \
     -H "Authorization: Bearer <token>"
   ```
   Expected: `403 Forbidden` with `IDENTITY_NOT_VERIFIED`

### Test 2: With Env Bypass
1. **Set `SKIP_IDENTITY_CHECK=true` in `.env`**
2. **Restart server**
3. **Try creating a ride:**
   ```bash
   curl -X POST http://localhost:5000/api/rides \
     -H "Authorization: Bearer <token>"
   ```
   Expected: `200 OK` (ride created)

### Test 3: With Mock Endpoint
1. **Call mock endpoint first:**
   ```bash
   curl -X POST http://localhost:5000/api/identity/mock-verify \
     -H "Authorization: Bearer <token>" \
     -d '{"userId": "<userId>"}'
   ```
2. **Then create ride:**
   ```bash
   curl -X POST http://localhost:5000/api/rides \
     -H "Authorization: Bearer <token>"
   ```
   Expected: `200 OK` (ride created)

---

## Production Safety

Both options are **production-safe**:

1. ✅ **Env bypass:** Only works when `NODE_ENV=development`
2. ✅ **Mock endpoint:** Returns `403 Forbidden` in production
3. ✅ **Identity middleware:** Always enforced in production

---

## Next Steps

1. **Add `SKIP_IDENTITY_CHECK=true` to `.env`** (recommended for now)
2. **Test ride creation** - should work with bypass
3. **When Persona is ready:**
   - Remove `SKIP_IDENTITY_CHECK` from `.env`
   - Test real Persona flow
   - Verify webhook sets `identityVerified`

---

## Summary

✅ **Identity verification middleware** - `requireIdentity` created  
✅ **Dev bypass (env)** - `SKIP_IDENTITY_CHECK=true`  
✅ **Dev bypass (endpoint)** - `/api/identity/mock-verify`  
✅ **Ride creation protected** - Requires identity (or bypass)  
✅ **Production safe** - No bypasses in production  

Your authorization pipeline is now complete and development-friendly! 🚀

