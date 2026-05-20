type LandingEvent =
  | "founding_access_viewed"
  | "driver_form_submitted"
  | "investor_form_submitted"
  | "demo_requested"
  | "deck_requested"
  | "whatsapp_invite_requested";

export function trackLandingEvent(event: LandingEvent, metadata: Record<string, unknown> = {}) {
  const payload = {
    event,
    metadata,
    path: window.location.pathname,
    occurredAt: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.info("[landing-event]", payload);
  }

  // TODO: persist landing analytics events or forward to PostHog/Plausible.
}

