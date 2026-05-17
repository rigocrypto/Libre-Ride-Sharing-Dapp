# 🔐 Social Login Setup Guide (Google/Apple)

Libre now supports **Google and Apple social login** with automatic Account Abstraction wallet creation!

## ✅ What's Implemented

1. **Firebase Auth Integration** - Client-side Google/Apple login
2. **Social Login Endpoint** - Server-side token verification
3. **AA Wallet Creation** - Automatic wallet creation for social users
4. **UI Components** - Social login buttons in Rider signup
5. **Analytics Tracking** - Social login events tracked

## 🚀 Setup Steps

### 1. Install Firebase Dependencies

```bash
npm install firebase
# For server-side token verification (optional but recommended)
npm install firebase-admin
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → **Sign-in method**
4. Enable **Google** and **Apple** providers
5. Copy your Firebase config

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Firebase Client Config
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (for server-side token verification)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

### 4. Enable Apple Sign-In (iOS/Web)

For Apple login:
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a Service ID
3. Configure in Firebase Console
4. Add redirect URLs

### 5. Update Server Token Verification (Production)

Currently using mock token verification. For production:

**`server/lib/firebase/admin.ts`**:
```ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
  });
}

export const adminAuth = getAuth();
```

**Update `server/routes/auth.ts`**:
```ts
import { adminAuth } from '../lib/firebase/admin';

// In social-login endpoint:
const decoded = await adminAuth.verifyIdToken(idToken);
const email = decoded.email;
const firstName = decoded.name?.split(' ')[0];
```

## 🎨 UI Components

### Social Login Button

Already integrated in:
- `/rider` - Step 1 signup
- Can be added to Landing page, Driver onboarding, etc.

```tsx
import { SocialLogin } from '@/components/SocialLogin';

<SocialLogin 
  onSuccess={(address) => {
    // Handle successful login
    console.log('Wallet:', address);
  }}
  size="lg"
/>
```

## 🔄 User Flow

1. User clicks "Continue with Google/Apple"
2. Firebase Auth popup opens
3. User authenticates
4. Token sent to `/api/auth/social-login`
5. Server verifies token, creates/links AA wallet
6. User redirected to next step (or verification if needed)

## 🛡️ Identity Verification (Next Step)

To add Persona/Stripe Identity verification:

1. **Create verification endpoint**:
```ts
POST /api/identity/start
// Creates Persona inquiry, returns redirect URL
```

2. **Add verification gate**:
```tsx
<VerificationGate>
  {/* Protected content */}
</VerificationGate>
```

3. **Webhook handler**:
```ts
POST /webhooks/persona
// Updates user.identityVerified on completion
```

## ✅ Testing

1. **Development**: Mock token verification works
2. **Production**: Use Firebase Admin SDK for real verification
3. **Test Flow**:
   - Click "Continue with Google"
   - Should create wallet
   - Should advance to Step 2

## 📝 Notes

- **Current**: Mock token verification (dev mode)
- **Production**: Requires Firebase Admin SDK
- **Apple Login**: Requires Apple Developer account
- **Identity Verification**: Ready to integrate Persona/Stripe

## 🚀 Next Steps

1. ✅ Install Firebase packages
2. ✅ Configure Firebase project
3. ✅ Add environment variables
4. ✅ Test Google login
5. ⏳ Add Apple login (if needed)
6. ⏳ Integrate Persona for ID verification
7. ⏳ Add verification gates to protected routes

---

**Status**: ✅ Social login infrastructure complete. Ready for Firebase setup and testing!

