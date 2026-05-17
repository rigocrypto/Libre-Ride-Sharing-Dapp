# Quick Start: Drizzle Database Setup

## Step 1: Add DATABASE_URL to .env

Open your `.env` file and add:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Quick Database Options:

**Neon (Free, Recommended):**
1. Go to https://neon.tech
2. Sign up → Create project
3. Copy connection string → Add to `.env`

**Supabase (Free):**
1. Go to https://supabase.com
2. Create project → Settings → Database
3. Copy connection string → Add to `.env`

**Local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/libre_rideshare
```

## Step 2: Push Schema to Database

```bash
npx drizzle-kit push
```

You should see:
```
✓ Schema pushed successfully
```

## Step 3: Start Server

```bash
npm run dev
```

Look for:
```
[DB] ✅ Connected to PostgreSQL
[storage] ✅ Using DrizzleStorage (PostgreSQL)
```

## ✅ Done!

Your app now uses persistent PostgreSQL storage instead of in-memory storage.

---

**Troubleshooting:**

- **"DATABASE_URL is not set"** → Add it to `.env` file
- **"Failed to connect"** → Check connection string format
- **"Table does not exist"** → Run `npx drizzle-kit push` again

See `ENV_SETUP.md` for detailed instructions.

