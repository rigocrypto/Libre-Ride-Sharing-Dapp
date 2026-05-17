/**
 * Social Auth Hook
 * Handles Google/Apple login with Firebase
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  OAuthProvider,
  UserCredential 
} from 'firebase/auth';
import { auth } from './config';
import { track } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';

interface UseSocialAuthReturn {
  loginWithGoogle: () => Promise<string | null>;
  loginWithApple: () => Promise<string | null>;
  isLoading: boolean;
}

export function useSocialAuth(): UseSocialAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle redirect result on mount (if user was redirected back from OAuth)
  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth) return;
      
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User completed redirect login
          const idToken = await result.user.getIdToken();
          const email = result.user.email;
          
          if (!email) return;
          
          // Send token to backend
          const res = await fetch('/api/auth/social-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, provider: 'google' }),
            credentials: 'include',
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.userId) {
              localStorage.setItem('libre_user_id', data.userId);
            }
            // Reload page to update auth state
            window.location.reload();
          }
        }
      } catch (error: any) {
        console.error('[Social Login] Redirect result error:', error);
      }
    };
    
    handleRedirectResult();
  }, []);

  const handleSocialLogin = useCallback(async (
    provider: GoogleAuthProvider | OAuthProvider,
    providerName: 'google' | 'apple'
  ): Promise<string | null> => {
    if (!auth) {
      toast({
        title: 'Auth not available',
        description: 'Firebase Auth is not configured. Please check your environment variables.',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      track(`${providerName}_login_start`);

      let result: UserCredential;
      
      // Try popup first, fall back to redirect if blocked
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // If popup is blocked, use redirect instead
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          console.log('[Social Login] Popup blocked, using redirect flow');
          await signInWithRedirect(auth, provider);
          // Redirect will happen, so we return here
          return null;
        }
        throw popupError;
      }
      
      const idToken = await result.user.getIdToken();
      const email = result.user.email;

      if (!email) {
        throw new Error('Email not provided by social provider');
      }

      // Send token to Libre backend
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, provider: providerName }),
        credentials: 'include',
      });

      if (!res.ok) {
        let errorMessage = `Login failed: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (data.success && data.address) {
        // Clear any stale userId/profile from previous sessions
        // (Important: MemStorage clears on server restart, but localStorage persists)
        const oldUserId = localStorage.getItem('libre_user_id');
        if (oldUserId && oldUserId !== data.userId) {
          console.log('[Social Login] Clearing stale userId from previous session');
          localStorage.removeItem('libre_user_id');
          localStorage.removeItem('libre_user_profile');
        }
        
        // Store new userId for profile fetching
        if (data.userId) {
          localStorage.setItem('libre_user_id', data.userId);
        }
        
        // Store profile data if provided (avoids race condition with separate fetch)
        if (data.profile) {
          localStorage.setItem('libre_user_profile', JSON.stringify(data.profile));
        }
        
        track(`${providerName}_login_success`, {
          userId: data.userId,
          needsVerification: data.needsVerification,
        });

        toast({
          title: 'Login successful!',
          description: data.needsVerification 
            ? 'Please verify your identity to continue.'
            : 'Welcome back to Libre!',
        });

        return data.address;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error(`[${providerName} Login] Error:`, error);
      track(`${providerName}_login_error`, { error: error.message });

      toast({
        title: 'Login failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    return handleSocialLogin(provider, 'google');
  }, [handleSocialLogin]);

  const loginWithApple = useCallback(async () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    return handleSocialLogin(provider, 'apple');
  }, [handleSocialLogin]);

  return {
    loginWithGoogle,
    loginWithApple,
    isLoading,
  };
}

