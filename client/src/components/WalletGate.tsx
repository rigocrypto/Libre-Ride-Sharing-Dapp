/**
 * WalletGate Component
 * 
 * Handles wallet linking for Firebase-authenticated users.
 * Flow:
 * 1. Check if user has Firebase auth
 * 2. Check wallet linking status
 * 3. If not linked, show "Link Wallet" button
 * 4. Generate nonce → Sign message → Link wallet
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getAuthHeader, getAuthHeaders } from '@/lib/api/authHeader';
import { resolveApiUrl } from '@/lib/queryClient';

interface WalletStatus {
  walletAddress: string | null;
  isLinked: boolean;
  walletVerifiedAt: string | null;
}

export function WalletGate() {
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Listen for auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        checkWalletStatus(firebaseUser);
      } else {
        setWalletStatus(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check wallet linking status
  const checkWalletStatus = async (firebaseUser?: User) => {
    const currentUser = firebaseUser || user;
    if (!currentUser) {
      return;
    }

    setIsLoading(true);
    try {
      // Use centralized auth header helper
      const headers = await getAuthHeader();
      const res = await fetch(resolveApiUrl('/api/wallet/status'), {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setWalletStatus(data);
      } else if (res.status === 401) {
        // Token expired or invalid, try refreshing
        console.log('[WalletGate] Token expired, refreshing...');
        const refreshedHeaders = await getAuthHeader(true); // Force refresh
        const retryRes = await fetch(resolveApiUrl('/api/wallet/status'), {
          headers: refreshedHeaders,
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          setWalletStatus(retryData);
        } else {
          console.error('[WalletGate] Still unauthorized after token refresh:', retryRes.status);
        }
      }
    } catch (error: any) {
      console.error('[WalletGate] Failed to check status:', error);
      // If auth error, user might need to log in again
      if (error.message?.includes('Not authenticated')) {
        toast({
          title: 'Authentication required',
          description: 'Please log in again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Connect wallet (MetaMask)
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask not found',
        description: 'Please install MetaMask to link your wallet.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setConnectedAddress(address);
      return address;
    } catch (error: any) {
      console.error('[WalletGate] Failed to connect wallet:', error);
      toast({
        title: 'Wallet connection failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Link wallet flow
  const linkWallet = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLinking(true);
    try {
      // 1. Connect wallet first (before API calls)
      const walletAddress = await connectWallet();
      if (!walletAddress) {
        setIsLinking(false);
        return;
      }

      // 2. Get nonce from backend (use centralized auth helper)
      const nonceHeaders = await getAuthHeaders({
        'Content-Type': 'application/json',
      });
      const nonceRes = await fetch(resolveApiUrl('/api/wallet/nonce'), {
        method: 'POST',
        headers: nonceHeaders,
      });

      if (!nonceRes.ok) {
        const errorData = await nonceRes.json();
        throw new Error(errorData.error || 'Failed to generate nonce');
      }

      const { nonce, message } = await nonceRes.json();

      // 4. Sign message with wallet
      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      // 5. Link wallet via backend (force refresh token for critical operation)
      const linkHeaders = await getAuthHeaders(
        {
          'Content-Type': 'application/json',
        },
        true // Force refresh for critical operation
      );
      const linkRes = await fetch(resolveApiUrl('/api/wallet/link'), {
        method: 'POST',
        headers: linkHeaders,
        body: JSON.stringify({
          signature,
          walletAddress,
        }),
      });

      if (!linkRes.ok) {
        const errorData = await linkRes.json();
        throw new Error(errorData.error || 'Failed to link wallet');
      }

      const result = await linkRes.json();

      // 6. Update status (force refresh)
      await checkWalletStatus(user);

      toast({
        title: 'Wallet linked successfully!',
        description: `Your wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} is now linked.`,
      });
    } catch (error: any) {
      console.error('[WalletGate] Failed to link wallet:', error);
      toast({
        title: 'Wallet linking failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLinking(false);
    }
  };

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // If wallet is already linked
  if (walletStatus?.isLinked && walletStatus.walletAddress) {
    return (
      <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-400">Wallet Linked</p>
              <p className="text-sm text-muted-foreground">
                {walletStatus.walletAddress.slice(0, 6)}...{walletStatus.walletAddress.slice(-4)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            Verified
          </Badge>
        </div>
      </Card>
    );
  }

  // If wallet not linked, show link button
  return (
    <Card className="p-4 bg-blue-500/10 border-blue-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-blue-400" />
          <div>
            <p className="font-semibold">Link Your Wallet</p>
            <p className="text-sm text-muted-foreground">
              Connect your MetaMask wallet to enable payments
            </p>
          </div>
        </div>
        <Button
          onClick={linkWallet}
          disabled={isLinking}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isLinking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Linking...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Link Wallet
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

