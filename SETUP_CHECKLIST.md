# ✅ Setup Checklist - Firebase + Persona

Quick reference checklist for setting up authentication and verification.

---

## 🔥 Firebase Setup (15-20 min)

- [ ] **Step 1**: Create Firebase project at https://console.firebase.google.com
- [ ] **Step 2**: Enable Google authentication
- [ ] **Step 3**: Create Web app, copy config values
- [ ] **Step 4**: Add `VITE_FIREBASE_*` vars to `.env`
- [ ] **Step 5**: Generate Firebase Admin private key
- [ ] **Step 6**: Add `FIREBASE_ADMIN_*` vars to `.env`
- [ ] **Step 7**: Restart server, test Google login

**Detailed guide**: See `FIREBASE_SETUP_GUIDE.md`

---

## 🪪 Persona Setup (10-15 min)

- [ ] **Step 1**: Create Persona account at https://withpersona.com
- [ ] **Step 2**: Create workspace (sandbox mode)
- [ ] **Step 3**: Create verification template
- [ ] **Step 4**: Get API key
- [ ] **Step 5**: Set up webhook (for production)
- [ ] **Step 6**: Add `PERSONA_*` vars to `.env`
- [ ] **Step 7**: Test verification flow

**Detailed guide**: See `PERSONA_SETUP_GUIDE.md`

---

## 🧪 Testing Checklist

### Firebase
- [ ] Google login button appears
- [ ] Clicking opens Google popup
- [ ] After login, wallet is created
- [ ] User advances to Step 2 (Request Ride)

### Persona
- [ ] `/verify` page loads
- [ ] "Start Verification" redirects to Persona
- [ ] Can complete verification in sandbox
- [ ] Webhook updates user status (check logs)

---

## 📝 Environment Variables Summary

Add these to your `.env` file:

```env
# Firebase Client
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="..."

# Persona
PERSONA_API_KEY=...
PERSONA_TEMPLATE_ID=...
PERSONA_WEBHOOK_SECRET=...
PERSONA_ENV=sandbox
```

---

## ✅ After Setup

Once both are configured:
1. ✅ Test Google login end-to-end
2. ✅ Test Persona verification flow
3. ✅ Verify webhook updates user status
4. ✅ Test verification gates on protected routes

---

**Status**: Ready to set up! Follow the guides above. 🚀

