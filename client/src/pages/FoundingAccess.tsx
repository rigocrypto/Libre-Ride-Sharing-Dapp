import { LandingComplianceNotice } from "@/components/landing/LandingComplianceNotice";
import { LandingDriverProgram } from "@/components/landing/LandingDriverProgram";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingInvestorSection } from "@/components/landing/LandingInvestorSection";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingProductCards } from "@/components/landing/LandingProductCards";
import { LandingRoadmap } from "@/components/landing/LandingRoadmap";
import { LandingTechStack } from "@/components/landing/LandingTechStack";
import { LandingTraction } from "@/components/landing/LandingTraction";
import { LandingUseOfFunds } from "@/components/landing/LandingUseOfFunds";
import { LandingWhyOrlando } from "@/components/landing/LandingWhyOrlando";
import { trackLandingEvent } from "@/lib/landingAnalytics";
import { getGithubLink, getTwitterLink, getWhatsAppLink } from "@/lib/socialLinks";
import { Github, MessageCircle, Twitter } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  let tag = document.head.querySelector(`script[data-json-ld="${id}"]`) as HTMLScriptElement | null;
  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.dataset.jsonLd = id;
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
}

export default function FoundingAccess() {
  useEffect(() => {
    document.title = "LIBRE Ride - Web3 Rideshare for Orlando";
    const description =
      "Join the founding driver program or request the investor deck for LIBRE Ride, the Web3 AI-powered rideshare platform built for Orlando.";
    const pageUrl = "https://rigocrypto.github.io/Libre-Ride-Sharing-Dapp/founding-access";
    const imageUrl = "https://rigocrypto.github.io/Libre-Ride-Sharing-Dapp/og-libre-founding.png";
    setMeta("description", description);
    setMeta("keywords", "Orlando rideshare driver, Web3 ride sharing, USDC escrow, MCO airport rides, Orlando transportation, founding driver program");
    setMeta("og:title", "LIBRE Ride - Web3 Rideshare for Orlando", true);
    setMeta("og:description", description, true);
    setMeta("og:url", pageUrl, true);
    setMeta("og:image", imageUrl, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "LIBRE Ride - Web3 Rideshare for Orlando");
    setMeta("twitter:description", description);
    setMeta("twitter:image", imageUrl);
    setJsonLd("founding-access", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LIBRE Ride",
      description: "Web3 AI-powered ride-sharing platform built for Orlando",
      url: pageUrl,
      foundingDate: "2025",
      areaServed: {
        "@type": "City",
        name: "Orlando, Florida",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Driver Recruitment",
        url: pageUrl,
      },
    });
    trackLandingEvent("founding_access_viewed");
  }, []);

  return (
    <div className="scroll-smooth bg-slate-950 text-white">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingProblem />
        <LandingWhyOrlando />
        <LandingProductCards />
        <LandingTraction />
        <LandingDriverProgram />
        <LandingInvestorSection />
        <LandingTechStack />
        <LandingRoadmap />
        <LandingUseOfFunds />
        <LandingComplianceNotice />
      </main>
      <footer className="border-t border-white/10 bg-slate-950 px-4 py-10 text-white md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xl font-black tracking-[0.18em]">
              LIBRE
            </Link>
            <p className="mt-2 text-sm text-slate-400">© 2026 LIBRE Ride. Built in Orlando.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <Link href="/privacy">Privacy Policy</Link>
            <a href="#compliance">Terms</a>
            <a href="mailto:hello@libreride.local">Contact</a>
          </div>
          <div className="flex gap-4 text-slate-300">
            {(() => {
              const github = getGithubLink();
              const twitter = getTwitterLink();
              const whatsapp = getWhatsAppLink();
              const iconClass =
                "rounded-md p-1 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300";
              return (
                <>
                  <a
                    href={github.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={github.label}
                    className={iconClass}
                  >
                    <Github className="h-5 w-5" />
                  </a>
                  <a
                    href={twitter.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={twitter.label}
                    className={iconClass}
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  {whatsapp && (
                    <a
                      href={whatsapp.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={whatsapp.label}
                      className={iconClass}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </footer>
    </div>
  );
}
