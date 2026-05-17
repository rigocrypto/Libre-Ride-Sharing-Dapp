/**
 * WebSocket Authentication
 *
 * Verify Firebase token on WS connection.
 * Socket identity is server-verified, never from client.
 */

import type { WebSocketServer, WebSocket } from 'ws';
import { getFirebaseAdmin } from '../lib/firebase/admin';

export interface AuthenticatedSocket extends WebSocket {
  user?: {
    userId: string;
    role: 'rider' | 'driver' | 'admin';
  };
  isAlive?: boolean;
}

/**
 * Verify Firebase ID token
 */
async function verifyIdToken(token: string) {
  const adminAuth = getFirebaseAdmin();
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized');
  }
  return adminAuth.verifyIdToken(token);
}

/**
 * Middleware to authenticate WS connections with Firebase token
 *
 * Usage:
 * ```
 * wss.on('connection', async (ws) => {
 *   await authenticateSocket(ws);
 *   // ...
 * });
 * ```
 */
export async function authenticateSocket(ws: AuthenticatedSocket, token?: string): Promise<boolean> {
  try {
    if (!token) {
      console.warn('[WS Auth] No token provided');
      ws.close(4001, 'Missing authentication token');
      return false;
    }

    // Verify Firebase token server-side
    const decodedToken = await verifyIdToken(token);

    // Query DB to get user role
    // (In a real setup, fetch from DB; for now, infer or require in token)
    ws.user = {
      userId: decodedToken.uid,
      role: (decodedToken.role || 'rider') as 'rider' | 'driver' | 'admin',
    };

    ws.isAlive = true;
    return true;
  } catch (err) {
    console.error('[WS Auth] Token verification failed:', err);
    ws.close(4001, 'Authentication failed');
    return false;
  }
}

/**
 * Simple heartbeat to detect stale connections
 *
 * Usage:
 * ```
 * const interval = setInterval(() => {
 *   wss.clients.forEach(ws => heartbeat(ws));
 * }, 30000);
 * ```
 */
export function heartbeat(ws: AuthenticatedSocket): void {
  ws.isAlive = false;
  ws.ping();
}

/**
 * Handle pong responses (client is alive)
 */
export function onPong(ws: AuthenticatedSocket): void {
  ws.isAlive = true;
}
