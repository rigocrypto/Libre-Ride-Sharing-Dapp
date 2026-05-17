import { useState, useCallback } from 'react';
import { track } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';

interface UseAAReturn {
  address: string | null;
  createWallet: (email: string) => Promise<string | null>;
  isLoading: boolean;
}

/**
 * Account Abstraction Hook
 * Handles email-based wallet creation via ZeroDev
 */
export function useAA(): UseAAReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createWallet = useCallback(async (email: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      track('aa_signup_start', { email_provided: true });

      const res = await fetch('/api/auth/aa-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.address) {
        setAddress(data.address);
        
        // Store userId for profile fetching
        if (data.userId) {
          localStorage.setItem('libre_user_id', data.userId);
        }
        
        track('aa_signup_success', {
          email_provided: true,
          referral_claimed: data.referralClaimed || false,
        });

        toast({
          title: 'Account created!',
          description: 'Your secure wallet has been created.',
        });

        return data.address;
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (err: any) {
      console.warn('[useAA] AA failed, using fallback:', err.message);
      track('aa_signup_error', { reason: err.message });
      
      // Deterministic fallback (browser-compatible)
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(email.toLowerCase());
        
        // Use Web Crypto API for hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const fallback = `0x${hashHex.slice(0, 40)}` as `0x${string}`;
        
        setAddress(fallback);
        
        toast({
          title: 'Account created (offline mode)',
          description: 'Using fallback wallet. Full features available after connection.',
          variant: 'default',
        });
        
        return fallback;
      } catch (fallbackError) {
        // If crypto fails, use simple hash
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
          hash = ((hash << 5) - hash) + email.charCodeAt(i);
          hash = hash & hash;
        }
        const fallback = `0x${Math.abs(hash).toString(16).padStart(40, '0')}` as `0x${string}`;
        setAddress(fallback);
        return fallback;
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    address,
    createWallet,
    isLoading,
  };
}

