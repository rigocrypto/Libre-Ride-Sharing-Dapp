# Drizzle Migration Guide

This guide walks you through migrating from MemStorage to DrizzleStorage (PostgreSQL).

## ✅ What's Been Implemented

### Core Infrastructure
- ✅ Drizzle database client (`server/db/client.ts`)
- ✅ Schema definitions (`server/db/schema/`)
  - Users (with firebaseUid, wallet linking, identity verification)
  - Wallet link nonces (persistent, replay-safe)
  - Driver documents
  - Rides (with escrow fields)
- ✅ DrizzleStorage implementation (`server/storage/DrizzleStorage.ts`)
- ✅ Automatic storage selection (`server/storage-factory.ts`)
- ✅ Wallet routes updated for persistent nonces

## 🚀 Quick Start

### 1. Set Up Database

Choose one:

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create database
createdb libre_rideshare

# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/libre_rideshare"
```

**Option B: Neon (Recommended for production)**
1. Go to https://neon.tech
2. Create a new project
3. Copy connection string
4. Set `DATABASE_URL` in `.env`

**Option C: Supabase**
1. Go to https://supabase.com
2. Create a new project
3. Copy connection string from Settings → Database
4. Set `DATABASE_URL` in `.env`

### 2. Add DATABASE_URL to `.env`

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 3. Generate and Run Migrations

```bash
# Generate migration files
npx drizzle-kit generate

# Push schema to database (or use migrations)
npx drizzle-kit push
```

### 4. Restart Server

The storage factory will automatically detect `DATABASE_URL` and use DrizzleStorage:

```bash
npm run dev
```

You should see:
```
[DB] ✅ Connected to PostgreSQL
[storage] ✅ Using DrizzleStorage (PostgreSQL)
```

## 📋 Migration Checklist

- [ ] Database created (PostgreSQL)
- [ ] `DATABASE_URL` set in `.env`
- [ ] Migrations generated (`npx drizzle-kit generate`)
- [ ] Schema pushed to database (`npx drizzle-kit push`)
- [ ] Server restarted
- [ ] Storage logs show "Using DrizzleStorage"
- [ ] Test: Create user → Verify in database
- [ ] Test: Wallet nonce → Verify persists after restart
- [ ] Test: Social login → Verify firebaseUid stored

## 🔍 Verifying Migration

### Check Database Connection

```bash
# In your database client or psql
psql $DATABASE_URL

# List tables
\dt

# Check users table
SELECT * FROM users LIMIT 5;
```

### Check Server Logs

Look for:
```
[DB] ✅ Connected to PostgreSQL
[storage] ✅ Using DrizzleStorage (PostgreSQL)
```

### Test User Creation

1. Sign up via social login
2. Check database:
   ```sql
   SELECT id, firebase_uid, email, role FROM users ORDER BY created_at DESC LIMIT 1;
   ```

### Test Wallet Nonce Persistence

1. Request wallet nonce (`POST /api/wallet/nonce`)
2. Restart server
3. Try to link wallet with same nonce
4. Should work (nonce persisted in DB)

## 🐛 Troubleshooting

### "Failed to connect to PostgreSQL"

**Check:**
- `DATABASE_URL` is set correctly
- Database server is running
- Network/firewall allows connection
- Credentials are correct

### "Storage does not support persistent nonces"

**Cause:** MemStorage is still being used

**Fix:**
- Ensure `DATABASE_URL` is set
- Restart server
- Check logs for "[storage] ✅ Using DrizzleStorage"

### "Table does not exist"

**Cause:** Migrations not run

**Fix:**
```bash
npx drizzle-kit push
```

### Type Errors

**Cause:** Schema types don't match

**Fix:**
- Ensure `server/db/schema/` matches your database
- Regenerate types: `npx drizzle-kit generate`

## 📊 Schema Overview

### Users Table
- `id` (UUID, primary key)
- `firebase_uid` (TEXT, unique, not null) ← **Primary auth identifier**
- `email` (TEXT, not null)
- `role` (TEXT: rider|driver|admin)
- `wallet_address` (TEXT, unique)
- `wallet_verified_at` (TIMESTAMP)
- `identity_verified` (BOOLEAN)
- `driver_status` (TEXT: unverified|pending|approved|rejected)

### Wallet Link Nonces Table
- `firebase_uid` (TEXT, primary key)
- `nonce` (TEXT, not null)
- `expires_at` (TIMESTAMP, not null)

### Driver Documents Table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `license_url` (TEXT)
- `insurance_url` (TEXT)
- `status` (TEXT: pending|approved|rejected)

### Rides Table
- `id` (UUID, primary key)
- `rider_id` (UUID, foreign key → users.id)
- `driver_id` (UUID, foreign key → users.id)
- `status` (TEXT)
- `escrow_id` (TEXT)
- `escrow_status` (TEXT: pending|locked|released|refunded)
- `escrow_tx_hash` (TEXT)

## 🔄 Rollback Plan

If you need to rollback to MemStorage:

1. Remove `DATABASE_URL` from `.env`
2. Set `STORAGE_ENGINE=mem` in `.env`
3. Restart server

MemStorage will be used automatically.

## ✅ Production Readiness

Once migrated:

- ✅ All user data persists across restarts
- ✅ Wallet nonces survive server restarts
- ✅ Firebase UID is primary auth identifier
- ✅ No more stale userId bugs
- ✅ Production-ready architecture

## 📝 Next Steps

After migration:

1. **Add Missing Tables** (if needed):
   - Badges
   - Waitlist
   - SOS Alerts
   - Disputes
   - Referrals

2. **Add Indexes** (for performance):
   ```sql
   CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
   CREATE INDEX idx_users_wallet_address ON users(wallet_address);
   CREATE INDEX idx_rides_rider_id ON rides(rider_id);
   CREATE INDEX idx_rides_driver_id ON rides(driver_id);
   ```

3. **Set Up Backups**:
   - Daily database backups
   - Point-in-time recovery (if using Neon/Supabase)

4. **Monitor**:
   - Connection pool usage
   - Query performance
   - Database size

---

**Status**: Ready for production ✅  
**Next**: Deploy to production and monitor database performance

