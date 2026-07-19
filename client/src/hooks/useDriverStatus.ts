/**
 * useDriverStatus Hook
 *
 * Manage driver online/offline status.
 * Updates location when online.
 *
 * Calls: POST /api/driver/status
 *
 * Returns:
 * - isOnline: Current online status
 * - setIsOnline: Update status
 * - isLoading: Request pending
 * - error: HTTP/network errors
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/queryClient';

interface DriverStatusResponse {
  success: boolean;
  data?: {
    driverId: string;
    isOnline: boolean;
    lat?: number;
    lng?: number;
    updatedAt: string;
  };
  error?: string;
}

export function useDriverStatus() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  /**
   * Get current device location
   * Returns { lat, lng } or null if unavailable
   */
  const getLocation = useCallback(
    () =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            // Fallback to Orlando if location denied
            resolve({ lat: 28.5383, lng: -81.3792 });
          }
        );
      }),
    []
  );

  /**
   * Mutation: Update driver status
   */
  const mutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      // Get location if going online
      const location = isOnline ? await getLocation() : null;

      const response = await fetch(resolveApiUrl('/api/driver/status'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_token')}`,
        },
        body: JSON.stringify({
          isOnline,
          ...(location && { lat: location.lat, lng: location.lng }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      return (await response.json()) as DriverStatusResponse;
    },
    onSuccess: (data) => {
      setError(null);
      // Invalidate any status queries
      queryClient.invalidateQueries({ queryKey: ['driver', 'status'] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setError(msg);
    },
  });

  return {
    isOnline: mutation.data?.data?.isOnline ?? false,
    setIsOnline: (online: boolean) => mutation.mutate(online),
    isLoading: mutation.isPending,
    error: error || mutation.error?.message || null,
  };
}
