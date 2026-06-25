# 🔥 Firebase Setup Guide - Step-by-Step

Follow these steps **in order** to enable Google/Apple social login.

---

## ✅ Step 1: Create Firebase Project

1. Go to: https://console.firebase.google.com
2. Click **"Add project"**
3. Project name: `libre-dev` (or `libre-prod`)
4. **Disable Google Analytics** (optional, can enable later)
5. Click **"Create project"**
6. Wait for project to initialize

✅ **Done when you see the Firebase Console dashboard**

---

## ✅ Step 2: Enable Google Authentication

1. In Firebase Console, click **"Authentication"** (left sidebar)
2. Click **"Get started"** (if first time)
3. Click **"Sign-in method"** tab
4. Click **"Google"**
5. Toggle **"Enable"** to ON
6. **Support email**: Your email address
7. Click **"Save"**

✅ **Google login is now enabled**

---

## ✅ Step 3: Create Web App (Get Client Config)

1. Click **⚙️ Project Settings** (gear icon, top left)
2. Scroll to **"Your apps"** section
3. Click **Web icon** `</>`
4. App nickname: `libre-web`
5. **Do NOT check** "Also set up Firebase Hosting"
6. Click **"Register app"**
7. **Copy the config values** (you'll see a code snippet)

You'll see something like:
```js
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "libre-dev.firebaseapp.com",
  projectId: "libre-dev",
  storageBucket: "libre-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

✅ **Copy these values - you'll need them next**

---

## ✅ Step 4: Add Client Environment Variables

1. In your project root, create or edit `.env` file
2. Add these lines (replace with YOUR values from Step 3):

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=libre-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=libre-dev
VITE_FIREBASE_STORAGE_BUCKET=libre-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

3. **Save the file**

⚠️ **IMPORTANT**: Restart your dev server after adding these:
```bash
# Stop server (Ctrl+C)
npm run dev
```

✅ **Client config is done**

---

## ✅ Step 5: Set Up Firebase Admin SDK (Server)

1. In Firebase Console, go to **⚙️ Project Settings**
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** in the popup
5. **Download the JSON file** (save it securely, don't commit to git!)

The JSON will look like:
```json
{
  "type": "service_account",
  "project_id": "libre-dev",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@libre-dev.iam.gserviceaccount.com",
  ...
}
```

✅ **You'll need: `project_id`, `client_email`, `private_key`**

---

## ✅ Step 6: Add Server Environment Variables

1. In your `.env` file, add these lines:

```env
FIREBASE_ADMIN_PROJECT_ID=libre-dev
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@libre-dev.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

⚠️ **CRITICAL FORMATTING**:
- Keep the **quotes** around `FIREBASE_ADMIN_PRIVATE_KEY`
- Keep the `\n` characters (they represent newlines)
- Copy the **entire** private key including `-----BEGIN` and `-----END` lines
- Replace actual newlines with `\n` in the string

**Example** (what it should look like):
```env
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...more lines...\n-----END PRIVATE KEY-----\n"
```

2. **Save the file**

3. **Restart your server**:
```bash
# Stop server (Ctrl+C)
npm run dev
```

✅ **Server config is done**

---

## ✅ Step 7: Test Google Login

1. Open http://localhost:5000/rider
2. Click **"Continue with Google"**
3. **Expected flow**:
   - Google popup opens
   - Select your Google account
   - Popup closes
   - You're redirected back
   - Wallet is created automatically
   - You advance to Step 2 (Request Ride)

✅ **If this works → Firebase setup is COMPLETE!**

---

## 🐛 Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"
- ✅ Check `VITE_FIREBASE_API_KEY` in `.env`
- ✅ Restart dev server after adding env vars
- ✅ Make sure no extra spaces in env values

### Error: "Firebase: Error (auth/unauthorized-domain)"
Social login (Google/Apple) only works on domains in Firebase's allowlist. This is a
**Firebase Console setting, not a code/env change** — the repo config is already correct.

- ✅ Firebase Console → **Authentication → Settings → Authorized domains → Add domain**
- ✅ Add the **bare host** that serves the app — no `https://`, no path:
  - `localhost` (already present by default, for local dev)
  - `rigocrypto.github.io` (GitHub Pages production)
- ⚠️ Do **not** enter `https://rigocrypto.github.io` or `rigocrypto.github.io/Libre-Ride-Sharing-Dapp/` — the field expects only the hostname.
- ℹ️ This is separate from `VITE_FIREBASE_AUTH_DOMAIN` (which is your `<project>.firebaseapp.com` OAuth handler and stays unchanged).
- ℹ️ Apple sign-in additionally needs the same host configured in the Apple Service ID return URLs; Google needs no extra step beyond the authorized-domains entry.

### Error: "Firebase Admin not configured"
- ✅ Check `FIREBASE_ADMIN_PRIVATE_KEY` format (quotes + `\n`)
- ✅ Verify `FIREBASE_ADMIN_PROJECT_ID` matches your project
- ✅ Restart server after adding env vars

### Google popup doesn't open
- ✅ Check browser console for errors
- ✅ Make sure popup blockers are disabled
- ✅ Try incognito mode

### "Invalid authentication token" on server
- ✅ Verify Firebase Admin private key format
- ✅ Check that `FIREBASE_ADMIN_CLIENT_EMAIL` is correct
- ✅ Make sure server restarted after env changes

---

## ✅ Next Steps

Once Firebase works:
1. ✅ Test Google login end-to-end
2. ✅ Set up Persona for ID verification
3. ✅ Add verification gates to protected routes

---

**Status**: Ready for Firebase setup! Follow steps 1-7 above. 🚀

