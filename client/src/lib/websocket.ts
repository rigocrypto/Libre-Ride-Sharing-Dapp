/**
 * Resolve the WebSocket URL for the current deployment context.
 *
 * Returns null when no real backend WebSocket is reachable — e.g. on
 * GitHub Pages, which is a static host and has no /ws server.
 *
 * Priority:
 *   1. VITE_WS_URL   — explicit override (e.g. wss://my-backend.onrender.com/ws)
 *   2. VITE_API_BASE_URL — derive wss:// from the API base (Render, Fly, etc.)
 *   3. null          — no backend configured; caller should use polling fallback
 *
 * github.io hosts are always treated as frontend-only and return null.
 */
export function getWebSocketUrl(): string | null {
  // Static demo host (GitHub Pages) has no /ws server — never attempt a socket.
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('github.io')
  ) {
    return null;
  }

  const explicitWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicitWsUrl) return explicitWsUrl;

  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!apiBase) return null;

  try {
    const url = new URL(apiBase);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}
