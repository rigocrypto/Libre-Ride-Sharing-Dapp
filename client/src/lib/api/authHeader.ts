/**
 * Auth Header Helper
 * 
 * Centralized helper for getting Firebase ID tokens for API calls.
 * Always use this helper instead of manually getting tokens.
 * 
 * Usage:
 *   const headers = await getAuthHeader();
 *   await fetch('/api/endpoint', { headers });
 */

import { getAuth } from 'firebase/auth';

/**
 * Get authentication headers with fresh Firebase ID token
 * 
 * @param forceRefresh - If true, forces token refresh (useful before critical operations)
 * @returns Headers object with Authorization Bearer token
 * @throws Error if user is not authenticated
 */
export async function getAuthHeader(forceRefresh = false): Promise<Record<string, string>> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Not authenticated. Please log in first.');
  }

  try {
    // Get token (fresh if forceRefresh is true)
    const token = await user.getIdToken(forceRefresh);

    if (!token) {
      throw new Error('Failed to get authentication token');
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error: any) {
    console.error('[AuthHeader] Failed to get ID token:', error);
    throw new Error('Failed to get authentication token. Please try logging in again.');
  }
}

/**
 * Get authentication headers and merge with existing headers
 * 
 * @param existingHeaders - Existing headers to merge with
 * @param forceRefresh - If true, forces token refresh
 * @returns Merged headers object
 */
export async function getAuthHeaders(
  existingHeaders: Record<string, string> = {},
  forceRefresh = false
): Promise<Record<string, string>> {
  const authHeader = await getAuthHeader(forceRefresh);
  return {
    ...existingHeaders,
    ...authHeader,
  };
}

