# Render & GitHub Pages Deploy Runbook

Quick steps to get the backend (Render) and frontend (GitHub Pages) working after a fresh deploy.

1) Render: set Firebase Admin private key

 - Go to Render → Your Service → Environment → Add Environment Variable
 - Key: `FIREBASE_ADMIN_PRIVATE_KEY`
 - Value: paste only the PEM private key string with escaped newlines, no surrounding quotes, for example:

```
-----BEGIN PRIVATE KEY-----\nMIIE...rest-of-key...\n-----END PRIVATE KEY-----\n
```

Do NOT paste the entire service account JSON. If Render reports "Failed to parse private key", re-copy the PEM and replace literal newlines with `\n`.

2) (Optional) Temporarily disable startup jobs while you validate migrations

 - Add env var `SKIP_STARTUP_JOBS=true` in Render to prevent background jobs from running on startup.

3) Redeploy on Render

 - Manual Deploy → Clear build cache & deploy

4) Verify backend health

 - Visit: `https://<your-render-url>/health`
 - Expected JSON: `{ "status": "ok", "service": "libre-api" }`

5) GitHub Pages: add Vite/Firebase secrets

 - Repository → Settings → Secrets and variables → Actions → New repository secret
 - Add the following secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_BASE_URL` (e.g., `https://libre-api.onrender.com`)

6) Trigger Pages build

 - Actions → Deploy frontend to GitHub Pages → Run workflow (or push to `main`)

7) Verify frontend

 - Visit: `https://rigocrypto.github.io/Libre-Ride-Sharing-Dapp/founding-access`
 - Confirm no black screen; open browser console for Firebase errors

8) Remove `SKIP_STARTUP_JOBS` once migrations and health checks succeed so scheduled jobs resume.

If anything fails, copy the first `relation "..." does not exist` error from Render logs and add a bootstrap migration `drizzle/0000_create_<table>.sql` before other migrations.
