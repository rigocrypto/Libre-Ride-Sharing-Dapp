/**
 * PostHog Analytics Integration
 * Tracks user events, referrals, signups, and conversions
 */

// Lazy initialize PostHog to avoid blocking if not configured
let posthog: any = null;

function initPostHog() {
  if (posthog) return posthog;
  
  const projectId = import.meta.env.VITE_POSTHOG_PROJECT_ID;
  if (!projectId) {
    // Silently fail if not configured (dev mode)
    return null;
  }

  try {
    // Dynamic import to avoid bundling PostHog if not needed
    import('posthog-js').then((ph) => {
      ph.default.init(projectId, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
        loaded: (posthogInstance) => {
          posthog = posthogInstance;
        },
        autocapture: false, // Disable auto-capture for privacy
        capture_pageview: false, // We'll track manually
      });
    }).catch((error) => {
      console.warn('[Analytics] Failed to load PostHog:', error);
    });
  } catch (error) {
    console.warn('[Analytics] Failed to initialize PostHog:', error);
  }
  
  return posthog;
}

/**
 * Track an event
 */
export function track(event: string, properties: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  const ph = initPostHog();
  if (!ph) {
    // Fallback: log to console in dev
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, Object.keys(properties).length > 0 ? properties : '');
    }
    return;
  }

  try {
    ph.capture(event, {
      ...properties,
      platform: 'libre-web',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[Analytics] Failed to track event:', error);
  }
}

/**
 * Identify a user
 */
export function identify(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  const ph = initPostHog();
  if (!ph) return;

  try {
    ph.identify(userId, traits);
  } catch (error) {
    console.warn('[Analytics] Failed to identify user:', error);
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  const ph = initPostHog();
  if (!ph) return;

  try {
    ph.setPersonProperties(properties);
  } catch (error) {
    console.warn('[Analytics] Failed to set user properties:', error);
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initPostHog();
}

