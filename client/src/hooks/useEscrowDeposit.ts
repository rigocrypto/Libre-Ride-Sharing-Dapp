/**
 * useEscrowDeposit Hook
 *
 * Initiates escrow funding:
 * 1. Request deposit from backend (gets TX data + contract call)
 * 2. User signs & sends via wallet
 * 3. Confirm TX to backend
 *
 * Returns: { deposit, isLoading, error, success }
 */

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

interface DepositError {
  type: 'insufficient_balance' | 'user_rejected' | 'network_error' | 'server_error' | 'unknown';
  message: string;
  code?: string;
}

export function useEscrowDeposit(rideId: string) {
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('firebaseToken');
      if (!token) throw new Error('Not authenticated');

      // Step 1: Request deposit TX from backend
      const initiateRes = await fetch('/api/escrow/deposit/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rideId }),
      });

      if (!initiateRes.ok) {
        const err = await initiateRes.json();
        const depositErr: DepositError = {
          type: 'server_error',
          message: err.error || 'Failed to initiate deposit',
          code: err.code,
        };

        // Map specific errors
        if (initiateRes.status === 402) {
          depositErr.type = 'insufficient_balance';
          depositErr.message = 'Insufficient USDC balance';
        } else if (initiateRes.status === 409) {
          depositErr.type = 'network_error';
          depositErr.message = 'Ride state changed - please refresh';
        }

        throw depositErr;
      }

      const { data: txData } = await initiateRes.json();

      // Step 2: User signs & sends transaction (via wallet)
      // This is handled by frontend wallet integration (Wagmi)
      // For now, assume wallet sends TX and returns txHash
      // (In real implementation, this would be a separate modal/component)

      const txHash = await sendDepositTransaction(txData);

      // Step 3: Confirm TX to backend
      const confirmRes = await fetch('/api/escrow/deposit/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rideId, txHash }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw new Error(err.error || 'Failed to confirm deposit');
      }

      setSuccess(true);
      return txHash;
    },
    onError: (error) => {
      setSuccess(false);
    },
  });

  return {
    deposit: () => mutation.mutate(),
    isLoading: mutation.isPending,
    error: mutation.error as DepositError | null,
    success,
  };
}

/**
 * sendDepositTransaction (Placeholder)
 *
 * In production, this would:
 * 1. Open wallet modal
 * 2. Request user to sign USDC approval
 * 3. Request user to send deposit TX
 * 4. Return TX hash
 *
 * For now, returns mock TX hash (to be integrated with Wagmi)
 */
async function sendDepositTransaction(txData: any): Promise<string> {
  // TODO: Integrate with Wagmi wallet
  // This is a placeholder - actual implementation requires:
  // - Wagmi client connection
  // - User approval flow
  // - Transaction sending
  throw new Error('Wallet integration required');
}
