/**
 * WebSocket Module
 *
 * Exports all WS utilities for real-time signaling.
 * Signaling only — no business logic, no DB writes.
 */

export { authenticateSocket, heartbeat, onPong } from './auth';
export type { AuthenticatedSocket } from './auth';

export { hasEmitted, markEmitted, emitOnce, clearDedup, getDedupSize } from './dedup';

export {
  broadcastRideOffered,
  notifyRiderAccepted,
  notifyDriverAccepted,
  broadcastRideWithdrawn,
} from './broadcast';

export { handleRideAccept, registerHandlers } from './handlers';
