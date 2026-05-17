/**
 * Rider View State Machine
 *
 * Deterministic state based on ride status + escrow status.
 * No side effects. Pure function.
 *
 * Returns: 'LOADING' | 'FINDING_DRIVER' | 'PAYMENT_REQUIRED' | 'DRIVER_ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'UNKNOWN'
 */

interface Ride {
  status: string;
  escrowStatus: string;
}

type RiderViewState =
  | 'LOADING'
  | 'FINDING_DRIVER'
  | 'PAYMENT_REQUIRED'
  | 'DRIVER_ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'UNKNOWN';

export function getRiderViewState(ride: Ride | undefined, escrow: any | undefined): RiderViewState {
  // Not loaded yet
  if (!ride || !escrow) return 'LOADING';

  // Ride complete
  if (ride.status === 'COMPLETED') return 'COMPLETED';

  // In progress
  if (ride.status === 'IN_PROGRESS') return 'IN_PROGRESS';

  // Accepted but no payment yet
  if (ride.status === 'ACCEPTED') {
    if (escrow.status !== 'locked' && escrow.status !== 'released') {
      return 'PAYMENT_REQUIRED';
    }
    // Accepted + payment received
    return 'DRIVER_ASSIGNED';
  }

  // Searching for driver (requested or offered)
  if (ride.status === 'REQUESTED' || ride.status === 'OFFERED') {
    return 'FINDING_DRIVER';
  }

  // Unknown state
  return 'UNKNOWN';
}
