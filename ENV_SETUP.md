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
# **Important:** When setting the private key in your host (Render, Heroku, etc.), DO NOT paste the entire service account JSON.
# Only paste the PEM private key value and escape newlines as `\n`. Do NOT wrap the value in quotes.
#
# Correct example (no surrounding quotes):
#
# ```env
# FIREBASE_ADMIN_PROJECT_ID=your-project-id
# FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
# FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...rest-of-key...\n-----END PRIVATE KEY-----\n
# ```
#
# Common mistakes to avoid:
# - Including surrounding quotes: `"-----BEGIN PRIVATE KEY-----\n..."` (wrong)
# - Pasting the whole JSON service account object (wrong)
# - Leaving literal newlines (depends on host) instead of escaped `\n` sequences

### Startup jobs safety toggle (Render)

If you want to prevent background startup jobs from running while you validate migrations, set:

```env
SKIP_STARTUP_JOBS=true
```

Unset it after the first successful deploy so scheduled jobs resume.

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

