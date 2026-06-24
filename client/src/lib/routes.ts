/**
 * Helpers for building internal links that respect the deployment base path.
 *
 * On GitHub Pages the app is served from a sub-path (`/Libre-Ride-Sharing-Dapp/`),
 * while locally it is served from `/`. Vite exposes the active base path as
 * `import.meta.env.BASE_URL`.
 *
 * IMPORTANT: For in-app navigation prefer wouter's <Link> / setLocation — the
 * router is already configured with `base`, so relative route hrefs like
 * "/rider" are resolved against the base automatically. Use these helpers ONLY
 * when you need a full, shareable/absolute URL (referral links, copy-to-clipboard,
 * emails) where wouter is not involved and a bare "/path" would drop the base.
 */

/** Join a route path onto a base path, collapsing duplicate slashes. */
export function joinBasePath(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, ""); // "" or "/Libre-Ride-Sharing-Dapp"
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const joined = `${trimmedBase}${suffix}`;
  return joined === "" ? "/" : joined;
}

/**
 * Returns the given route prefixed with the deployment base path, e.g.
 * "/rider" -> "/Libre-Ride-Sharing-Dapp/rider" on GitHub Pages, "/rider" locally.
 */
export function buildInternalPath(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return joinBasePath(base, path);
}

/**
 * Returns an absolute, shareable URL for an internal route, preserving the
 * deployment base path, e.g. "https://host/Libre-Ride-Sharing-Dapp/rider".
 */
export function buildAppUrl(path: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${buildInternalPath(path)}`;
}
