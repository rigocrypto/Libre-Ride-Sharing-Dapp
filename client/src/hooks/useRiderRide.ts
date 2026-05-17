/**
 * useRiderRide Hook
 *
 * Fetches ride details + subscribes to WebSocket updates.
 * Single source of truth: REST query, WS signals refetch.
 *
 * Returns: { data: Ride, isLoading, error, refetch }
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

interface Ride {
  id: string;
  status: 'REQUESTED' | 'OFFERED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  riderId: string;
  driverId?: string;
  driver?: {
    id: string;
    name: string;
    rating: number;
    vehicle: string;
    licensePlate: string;
    latitude?: number;
    longitude?: number;
  };
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  estimatedPrice: number;
  estimatedDuration: number;
  estimatedDistance: number;
  escrowStatus: 'pending' | 'locked' | 'released' | 'refunded';
  escrowAmount: number;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export function useRiderRide(rideId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  const query = useQuery({
    queryKey: ['ride', rideId],
    queryFn: async () => {
      const token = localStorage.getItem('firebaseToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch ride');
      }

      return response.json().then((payload) => {
        const ride = (payload.data ?? payload) as any;
        const pickup = typeof ride.pickupLocation === 'object' ? ride.pickupLocation : null;
        const dropoff = typeof ride.dropoffLocation === 'object' ? ride.dropoffLocation : null;
        const driverDetails = ride.driver?.driverDetails;

        return {
          ...ride,
          pickupLocation: pickup?.address ?? ride.pickupLocation,
          pickupLat: pickup?.lat ?? ride.pickupLat,
          pickupLng: pickup?.lng ?? ride.pickupLng,
          dropoffLocation: dropoff?.address ?? ride.dropoffLocation,
          dropoffLat: dropoff?.lat ?? ride.dropoffLat,
          dropoffLng: dropoff?.lng ?? ride.dropoffLng,
          estimatedDuration: ride.estimatedDuration ?? ride.duration ?? 12,
          estimatedDistance: ride.estimatedDistance ?? ride.distance ?? 4.2,
          escrowStatus: ride.escrowStatus ?? 'pending',
          escrowAmount: ride.escrowAmount ?? ride.estimatedPrice,
          driver: ride.driver
            ? {
                id: ride.driver.id,
                name: ride.driver.username ?? ride.driver.email ?? 'Libre Driver',
                rating: driverDetails?.reputationScore ?? 5,
                vehicle: [
                  driverDetails?.vehicleColor,
                  driverDetails?.vehicleMake,
                  driverDetails?.vehicleModel,
                ].filter(Boolean).join(' ') || 'Verified vehicle',
                licensePlate: driverDetails?.licensePlate ?? 'Pending',
              }
            : undefined,
        } as Ride;
      });
    },
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'REQUESTED' ||
        status === 'OFFERED' ||
        status === 'ACCEPTED' ||
        status === 'IN_PROGRESS'
        ? 1000
        : false;
    },
    staleTime: 5000, // 5s cache
  });

  // Subscribe to WebSocket updates
  useEffect(() => {
    const token = localStorage.getItem('firebaseToken');
    if (!token) return;

    try {
      wsRef.current = new WebSocket(
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
      );

      wsRef.current.addEventListener('open', () => {
        wsRef.current?.send(JSON.stringify({ type: 'auth', token }));
      });

      wsRef.current.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);

          // Refetch on ride state changes
          if (
            (message.type === 'ride.accepted' ||
              message.type === 'ride.started' ||
              message.type === 'ride.completed' ||
              message.type === 'ride_updated' ||
              message.type === 'escrow:locked') &&
            message.rideId === rideId
          ) {
            queryClient.invalidateQueries({ queryKey: ['ride', rideId] });
          }
        } catch (err) {
          console.error('[useRiderRide] WS parse error:', err);
        }
      });

      wsRef.current.addEventListener('error', (err) => {
        console.error('[useRiderRide] WS error:', err);
      });

      return () => {
        wsRef.current?.close();
      };
    } catch (err) {
      console.error('[useRiderRide] WS connection failed:', err);
    }
  }, [rideId, queryClient]);

  return query;
}
