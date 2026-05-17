import { useState, useEffect } from 'react';

interface UseWalletReturn {
  balance: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Wallet Hook
 * Fetches user's rewards/cashback balance
 */
export function useWallet(address?: string | null): UseWalletReturn {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    if (!address) {
      setBalance(0);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      // const res = await fetch(`/api/rider/stats?address=${address}`);
      // const data = await res.json();
      // setBalance(data.balance || 0);
      
      // Mock balance for now
      setBalance(12.50);
    } catch (error) {
      console.error('[useWallet] Failed to fetch balance:', error);
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [address]);

  return {
    balance,
    isLoading,
    refresh,
  };
}

