# 🧪 Libre Testing Guide

## Quick Test Script (30 minutes)

### Prerequisites
1. **ZeroDev Account** (optional but recommended)
   - Sign up at [zerodev.app](https://zerodev.app)
   - Create project → Copy Project ID
   - Add to `.env`: `ZERO_DEV_PROJECT_ID=your_id`

2. **PostHog Account** (optional but recommended)
   - Sign up at [posthog.com](https://posthog.com)
   - Create project → Copy Project API Key
   - Add to `.env`: `VITE_POSTHOG_PROJECT_ID=your_id`

3. **Treasury Wallet** (for referral payments)
   - Create test wallet on Base Sepolia
   - Fund with test USDC (get from faucet)
   - Add to `.env`: `TREASURY_PRIVATE_KEY=0x...`

### Test 1: AA Email Signup

**Steps:**
1. Start server: `npm run dev`
2. Visit: `http://localhost:5000/become-driver`
3. Enter email: `test@example.com`
4. Click "Create Account → Continue"

**Expected:**
- ✅ Wallet address generated (check console)
- ✅ User created in database
- ✅ Welcome email sent (if Resend configured)
- ✅ Analytics event: `aa_signup_success`
- ✅ Flow continues to profile step

**Verify:**
```sql
SELECT email, wallet_address, role FROM users WHERE email = 'test@example.com';
```

**Check Analytics:**
- PostHog dashboard → Events → Filter `aa_signup_success`
- Or check browser console for `[Analytics]` logs

---

### Test 2: Referral Chain

**Steps:**
1. Visit: `http://localhost:5000/profile`
2. Get referral code (e.g., `LIBREABC123`)
3. Copy referral link
4. Open incognito/new browser
5. Visit: `http://localhost:5000/become-driver?ref=LIBREABC123`
6. Complete driver signup

**Expected:**
- ✅ Referral code detected (toast notification)
- ✅ Analytics event: `referral_code_detected`
- ✅ On signup completion: Referral bonus claimed
- ✅ USDC transaction sent (if treasury configured)
- ✅ Analytics event: `referral_claim`

**Verify:**
```sql
SELECT * FROM referrals WHERE referral_code = 'LIBREABC123';
-- Should show claimed = true, referred_user_id set
```

**Check Payment:**
- Base Sepolia explorer: Search for transaction hash
- Or check server logs for `[Referral Bonus]` messages

---

### Test 3: Analytics Events

**Check PostHog Dashboard:**
1. Go to PostHog → Events
2. Filter by event name:
   - `landing_view`
   - `aa_signup_start`
   - `aa_signup_success`
   - `driver_onboarding_start`
   - `driver_step_complete`
   - `driver_signup_complete`
   - `referral_code_detected`
   - `referral_claim`
   - `referral_link_copied`

**Or Check Console:**
- Browser console shows `[Analytics]` logs in dev mode
- Server logs show `[AA]` and `[Referral Bonus]` messages

---

### Test 4: Wallet Referral Payment

**Prerequisites:**
- Treasury wallet funded with USDC on Base Sepolia
- `TREASURY_PRIVATE_KEY` set in `.env`
- `USDC_CONTRACT_ADDRESS_TESTNET` set

**Steps:**
1. Complete referral claim (Test 2)
2. Check server logs for transaction hash
3. Verify on Base Sepolia explorer

**Expected:**
- ✅ Transaction hash returned
- ✅ USDC transferred to referrer's wallet
- ✅ Server logs: `[Referral Bonus] Sent $50 USDC...`

**Verify:**
```bash
# Check Base Sepolia explorer
# Transaction should show USDC transfer from treasury to referrer
```

---

## Common Issues & Fixes

### Issue: "ZERO_DEV_PROJECT_ID not configured"
**Fix:** Add to `.env` or use fallback (deterministic address)

### Issue: "TREASURY_PRIVATE_KEY not configured"
**Fix:** Referral payments will be skipped, but claim still works

### Issue: "PostHog events not showing"
**Fix:** 
- Check `VITE_POSTHOG_PROJECT_ID` is set
- Check browser console for errors
- Events log to console in dev mode if PostHog not configured

### Issue: "Referral payment failed"
**Fix:**
- Check treasury wallet has USDC balance
- Check Base Sepolia RPC is accessible
- Verify USDC contract address is correct
- Payment failure doesn't block referral claim

---

## Database Queries for Verification

```sql
-- Check recent users
SELECT email, wallet_address, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check referrals
SELECT referral_code, referrer_id, referred_user_id, claimed, reward_amount
FROM referrals
ORDER BY created_at DESC
LIMIT 10;

-- Check referral stats for a user
SELECT 
  COUNT(*) as total_referrals,
  SUM(CASE WHEN claimed THEN reward_amount ELSE 0 END) as total_earned
FROM referrals
WHERE referrer_id = 'user-id-here';
```

---

## Performance Benchmarks

**Expected Times:**
- AA signup: < 2 seconds
- Referral claim: < 1 second
- USDC payment: 5-15 seconds (blockchain confirmation)
- Analytics event: < 100ms

---

## Next Steps After Testing

1. **Monitor Analytics Dashboard**
   - Track conversion rates
   - Identify drop-off points
   - Optimize based on data

2. **Test Referral Chain**
   - Share referral link
   - Track viral coefficient
   - Monitor payment success rate

3. **Beta Launch Prep**
   - Invite first 100 users
   - Monitor signups
   - Track referral growth

**Libre is ready for beta!** 🚀

