/**
 * useRideOffers Hook
 *
 * Listen for ride offer events from WebSocket.
 * Manages the live ride offer displayed to driver.
 *
 * Returns:
 * - currentOffer: Current ride offer or null
 * - isLoading: WS connection state
 * - error: Connection/parse errors
 */

import { useEffect, useState, useCallback } from 'react';
import { getWebSocketUrl } from '@/lib/websocket';

export interface RideOffer {
  rideId: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  estimatedMiles: number;
  estimatedPrice: number;
}

export function useRideOffers() {
  const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(async () => {
    try {
      // Get Firebase token from localStorage or auth context
      const token = localStorage.getItem('firebase_token');
      if (!token) {
        setError('No authentication token');
        setIsLoading(false);
        return;
      }

      // Connect to WS with token
      const baseWsUrl = getWebSocketUrl();
      if (!baseWsUrl) {
        setError('WebSocket not available: no backend configured');
        setIsLoading(false);
        return;
      }
      const wsUrl = `${baseWsUrl}?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WS] Connected for ride offers');
        setError(null);
        setIsLoading(false);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle ride offer
          if (message.type === 'ride.offered') {
            setCurrentOffer({
              rideId: message.rideId,
              pickup: message.pickup,
              dropoff: message.dropoff,
              estimatedMiles: message.estimatedMiles,
              estimatedPrice: message.estimatedPrice,
            });
          }

          // Handle ride withdrawn (offer no longer available)
          if (message.type === 'ride.withdrawn') {
            if (currentOffer?.rideId === message.rideId) {
              setCurrentOffer(null);
            }
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      };

      socket.onerror = (err) => {
        console.error('[WS] Connection error:', err);
        setError('WebSocket connection error');
      };

      socket.onclose = () => {
        console.log('[WS] Disconnected');
        // Auto-reconnect after 3 seconds
        setTimeout(() => connect(), 3000);
      };

      setWs(socket);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      setIsLoading(false);
    }
  }, [currentOffer?.rideId]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return {
    currentOffer,
    isLoading,
    error,
    ws,
  };
}
