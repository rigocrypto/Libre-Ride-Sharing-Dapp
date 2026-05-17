import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [onlineDrivers, setOnlineDrivers] = useState<number>(0);
  const [location] = useLocation();

  // WebSocket for live driver count
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          ws?.send(JSON.stringify({ type: 'stats_subscribe' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'stats_update' && data.stats) {
              setOnlineDrivers(data.stats.onlineDrivers || 0);
            }
          } catch (error) {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          // Ignore errors
        };

        ws.onclose = () => {
          ws = null;
          if (isMounted) {
            reconnectTimeout = setTimeout(() => connect(), 5000);
          }
        };
      } catch (error) {
        if (isMounted) {
          reconnectTimeout = setTimeout(() => connect(), 5000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, []);

  return (
    <>
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-indigo-500/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent cursor-pointer">
              🏎️ Libre
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/rider">
              <span className="px-4 py-2 rounded-lg border border-indigo-500/50 hover:bg-indigo-500/20 transition cursor-pointer">
                Ride
              </span>
            </Link>
            <Link href="/become-driver">
              <span className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer">
                Drive
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-20 min-h-screen">{children}</main>

      {/* Footer */}
      <footer className="bg-black/80 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center opacity-75 text-sm">
          <p>Libre © 2024 | Fairer ridesharing | Orlando & Beyond</p>
          <p className="mt-2">
            🚗 {onlineDrivers > 0 ? `${onlineDrivers} drivers online` : 'Connecting...'}
          </p>
        </div>
      </footer>
    </>
  );
};

