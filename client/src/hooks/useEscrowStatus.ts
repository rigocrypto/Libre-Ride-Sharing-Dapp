/**
 * useEscrowStatus Hook
 *
 * Polls escrow status until FUNDED.
 * Stops polling once payment is confirmed.
 *
 * Returns: { data: { status, amount }, isLoading, error, refetch }
 */

import { useQuery } from '@tanstack/react-query';

interface EscrowStatus {
  status: 'pending' | 'locked' | 'released' | 'refunded';
  amount: number;
  txHash?: string;
}

export function useEscrowStatus(rideId: string, enabled: boolean = true) {
  return useQuery<EscrowStatus, Error>({
    queryKey: ['escrow', rideId],
    queryFn: async () => {
      const token = localStorage.getItem('firebaseToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/escrow/status/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch escrow status');
      }

      return response.json().then((payload) => {
        const data = payload.data ?? payload;
        return {
          status: data.status ?? data.escrowStatus ?? 'pending',
          amount: data.amount ?? data.escrowAmount ?? 0,
          txHash: data.txHash ?? data.escrowTxHash,
        } as EscrowStatus;
      });
    },
    enabled, // Only fetch if enabled
    refetchInterval: (escrowData) => {
      // Stop polling once locked
      if ((escrowData as unknown as EscrowStatus | undefined)?.status === 'locked') return false;
      return 2000; // Poll every 2s while pending
    },

    staleTime: 1000,
  });
}
