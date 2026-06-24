/**
 * Resolves LIBRE's public social / contact links.
 *
 * All links are overridable via Vite env vars so they can be configured per
 * deploy without code changes. GitHub and WhatsApp ship with real defaults;
 * Twitter/X is a placeholder until an official handle exists. Env is read at
 * call time so it works in both the browser and tests.
 */
import { DEFAULT_LIBRE_WHATSAPP, normalizeWhatsAppPhone } from "./whatsapp";

export interface SocialLink {
  href: string;
  label: string;
}

const DEFAULT_GITHUB_URL = "https://github.com/rigocrypto/Libre-Ride-Sharing-Dapp";
const DEFAULT_TWITTER_URL = "https://x.com/LibreRide"; // placeholder — override with VITE_LIBRE_TWITTER_URL

function env(key: string): string | undefined {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  return value?.trim() || undefined;
}

export function getGithubLink(): SocialLink {
  return { href: env("VITE_LIBRE_GITHUB_URL") || DEFAULT_GITHUB_URL, label: "LIBRE on GitHub" };
}

export function getWhatsAppLink(): SocialLink | null {
  // Prefer a full URL override; otherwise build wa.me from the support number
  // (env override, then the shared default).
  const explicit = env("VITE_LIBRE_WHATSAPP_URL");
  if (explicit) return { href: explicit, label: "Contact LIBRE on WhatsApp" };

  const phone = normalizeWhatsAppPhone(env("VITE_LIBRE_WHATSAPP") || DEFAULT_LIBRE_WHATSAPP);
  if (!phone) return null;
  return { href: `https://wa.me/${phone}`, label: "Contact LIBRE on WhatsApp" };
}

export function getTwitterLink(): SocialLink {
  return { href: env("VITE_LIBRE_TWITTER_URL") || DEFAULT_TWITTER_URL, label: "LIBRE on X (Twitter)" };
}
