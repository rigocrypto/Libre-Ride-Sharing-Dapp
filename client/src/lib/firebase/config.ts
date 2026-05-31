/**
 * Firebase Auth Configuration
 * Handles Google/Apple social login
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Dev-only: never log Firebase env details in production builds.
if (import.meta.env.DEV && import.meta.env.MODE === "development") {
  console.log('[Firebase Config] Environment variables check:');
  console.log('  VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? `${import.meta.env.VITE_FIREBASE_API_KEY.slice(0, 10)}...` : '❌ UNDEFINED');
  console.log('  VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ UNDEFINED');
  console.log('  VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ UNDEFINED');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required config
if (!firebaseConfig.apiKey) {
  console.error('[Firebase Config] ❌ VITE_FIREBASE_API_KEY is missing! Check your .env file.');
}

// Initialize Firebase (only if not already initialized)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
}

export { auth };
export default app;

