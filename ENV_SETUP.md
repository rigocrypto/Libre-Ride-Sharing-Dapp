# Environment Variables Setup

## Required: DATABASE_URL

Add this line to your `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Database Options

### Option 1: Local PostgreSQL

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/libre_rideshare
```

**Setup:**
```bash
# Create database
createdb libre_rideshare

# Or via psql
psql -U postgres
CREATE DATABASE libre_rideshare;
```

### Option 2: Neon (Recommended - Free Tier Available)

1. Go to https://neon.tech
2. Sign up / Login
3. Create a new project
4. Copy the connection string from the dashboard
5. Add to `.env`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Option 3: Supabase (Free Tier Available)

1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to `.env`:

```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Option 4: Railway (Easy Deployment)

1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Copy the connection string
4. Add to `.env`:

```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

## After Adding DATABASE_URL

1. **Generate migrations:**
   ```bash
   npx drizzle-kit generate
   ```

2. **Push schema to database:**
   ```bash
   npx drizzle-kit push
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

4. **Verify connection:**
   Look for these logs:
   ```
   [DB] ✅ Connected to PostgreSQL
   [storage] ✅ Using DrizzleStorage (PostgreSQL)
   ```

## Current .env Structure

Your `.env` file should include:

```env
# Firebase Client (for frontend)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Firebase Admin (for backend)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="..."

# Database (NEW - Required for DrizzleStorage)
DATABASE_URL=postgresql://user:password@host:5432/database

# Other
NODE_ENV=development
PORT=5000
STORAGE_ENGINE=drizzle  # Optional: forces DrizzleStorage
```

## Troubleshooting

### "Failed to connect to PostgreSQL"

- Check `DATABASE_URL` format is correct
- Verify database server is running
- Check network/firewall settings
- Verify credentials are correct

### "Table does not exist"

Run migrations:
```bash
npx drizzle-kit push
```

### Still using MemStorage?

- Ensure `DATABASE_URL` is set
- Restart server completely
- Check logs for "[storage] ✅ Using DrizzleStorage"

---

**Next Step:** Add `DATABASE_URL` to your `.env` file, then run migrations!

