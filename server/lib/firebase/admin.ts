/**
 * Firebase Admin SDK
 * Server-side token verification for social login
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | null = null;
let adminAuth: Auth | null = null;

/**
 * Initialize Firebase Admin (call once at server startup)
 * 
 * PRODUCTION: Fails hard if misconfigured
 * DEVELOPMENT: Falls back to dev mode with warning
 */
export function initFirebaseAdmin(): Auth | null {
  if (adminAuth) {
    return adminAuth;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    if (isProduction) {
      console.error('[Firebase Admin] FATAL: Required environment variables missing in production!');
      console.error('[Firebase Admin] Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY');
      throw new Error('Firebase Admin SDK not configured. Server cannot start in production without authentication.');
    }
    console.warn('[Firebase Admin] Not configured. Social login will use dev mode.');
    return null;
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      app = getApps()[0];
    }

    adminAuth = getAuth(app);
    console.log('[Firebase Admin] Initialized successfully');
    return adminAuth;
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization failed:', error.message);
    return null;
  }
}

/**
 * Get Firebase Admin Auth instance
 */
export function getFirebaseAdmin(): Auth | null {
  if (!adminAuth) {
    return initFirebaseAdmin();
  }
  return adminAuth;
}

// Auto-initialize on module load
if (typeof process !== 'undefined') {
  initFirebaseAdmin();
}

