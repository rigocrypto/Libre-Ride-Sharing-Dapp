/**
 * User Profile Hook
 * Fetches user profile including verification status
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { track } from '@/lib/analytics';
import { resolveApiUrl } from '@/lib/queryClient';

interface UserProfile {
  id: string;
  email: string | null;
  walletAddress: string | null;
  username: string | null;
  role: string;
  identityVerified: boolean;
  identityVerifiedAt: Date | null;
  authProvider?: 'email' | 'google' | 'apple';
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isVerified: boolean;
  refetch: () => void;
}

/**
 * Fetch user profile from API
 */
async function fetchUserProfile(userId?: string): Promise<UserProfile | null> {
  if (!userId) {
    // Try to get from localStorage or session
    const stored = localStorage.getItem('libre_user_id');
    if (!stored) {
      // Check if profile was stored directly from login
      const profileData = localStorage.getItem('libre_user_profile');
      if (profileData) {
        try {
          return JSON.parse(profileData);
        } catch (e) {
          console.warn('[useUserProfile] Failed to parse stored profile');
        }
      }
      return null;
    }
    userId = stored;
  }

  try {
    const res = await fetch(resolveApiUrl(`/api/user/profile?userId=${userId}`), {
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 404) {
        // User not found - likely server was restarted (MemStorage cleared)
        // Clear stale userId and profile from localStorage
        console.warn('[useUserProfile] User not found (404), clearing stale data');
        localStorage.removeItem('libre_user_id');
        localStorage.removeItem('libre_user_profile');
        
        // Try to get from localStorage as fallback (might have fresh data from login)
        const profileData = localStorage.getItem('libre_user_profile');
        if (profileData) {
          try {
            const parsed = JSON.parse(profileData);
            // Only use if it matches the requested userId
            if (parsed.id === userId) {
              return parsed;
            }
          } catch (e) {
            console.warn('[useUserProfile] Failed to parse stored profile');
          }
        }
        return null;
      }
      throw new Error(`Failed to fetch profile: ${res.status}`);
    }

    const data = await res.json();
    // Update localStorage with fresh profile data
    if (data.id) {
      localStorage.setItem('libre_user_profile', JSON.stringify(data));
    }
    return data;
  } catch (error) {
    console.error('[useUserProfile] Fetch error:', error);
    // Fallback to stored profile
    const profileData = localStorage.getItem('libre_user_profile');
    if (profileData) {
      try {
        return JSON.parse(profileData);
      } catch (e) {
        console.warn('[useUserProfile] Failed to parse stored profile');
      }
    }
    return null;
  }
}

/**
 * Hook to get user profile and verification status
 */
export function useUserProfile(userId?: string): UseUserProfileReturn {
  const [storedUserId, setStoredUserId] = useState<string | undefined>(userId);

  useEffect(() => {
    if (!storedUserId) {
      const stored = localStorage.getItem('libre_user_id');
      if (stored) setStoredUserId(stored);
    }
  }, [storedUserId]);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['userProfile', storedUserId],
    queryFn: () => fetchUserProfile(storedUserId),
    enabled: !!storedUserId,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Retry up to 3 times for 404 errors (user might be created shortly)
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        // If 404 after retries, clear stale userId (server was restarted)
        if (failureCount >= 2) {
          console.warn('[useUserProfile] User not found after retries, clearing stale userId');
          localStorage.removeItem('libre_user_id');
          localStorage.removeItem('libre_user_profile');
        }
        return failureCount < 3;
      }
      // Don't retry other errors
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
  });

  // Track verification status changes
  useEffect(() => {
    if (profile?.identityVerified) {
      track('user_verified', { userId: profile.id });
    }
  }, [profile?.identityVerified]);

  return {
    profile: profile || null,
    isLoading,
    isVerified: profile?.identityVerified || false,
    refetch: () => {
      refetch();
    },
  };
}

