import { Bot, Car, LayoutDashboard, Smartphone, WalletCards, type LucideIcon } from "lucide-react";

export type ProductCard = {
  title: string;
  body: string;
  Icon: LucideIcon;
  /**
   * Internal demo route. When set, the card shows a live CTA. wouter's <Link>
   * resolves this against the router base, so the GitHub Pages sub-path
   * (/Libre-Ride-Sharing-Dapp/) is preserved automatically.
   */
  href?: string;
  /** CTA label shown when the demo is live (href set). */
  cta?: string;
  /** Note shown under the disabled button when the demo isn't available yet. */
  comingSoonNote?: string;
};

// Rider, Driver, and Admin demos already exist as routes (see App.tsx), so their
// cards link straight into the demo. AI Dispatch and Web3 Wallet Flow are not
// built yet and stay disabled/"Coming Soon".
export const productCards: ProductCard[] = [
  { title: "Rider App", body: "Fare quote, escrow deposit, USDC payment, and trip state clarity.", Icon: Smartphone, href: "/rider", cta: "Open Rider Demo" },
  { title: "Driver Dashboard", body: "AI copilot, compliance state, earnings, and ride offer flow.", Icon: Car, href: "/driver", cta: "Open Driver Demo" },
  { title: "Admin Escrow Monitoring", body: "Locked, released, disputed, failed, and manual-review states.", Icon: LayoutDashboard, href: "/admin", cta: "Open Admin Demo" },
  { title: "AI Dispatch", body: "Matching roadmap based on compliance, location, rating, and escrow readiness.", Icon: Bot, comingSoonNote: "AI dispatch demo coming in a future release." },
  { title: "Web3 Wallet Flow", body: "USDC approve -> deposit -> verify -> release flow proven on testnet.", Icon: WalletCards, comingSoonNote: "Wallet flow demo coming in a future release." },
];
