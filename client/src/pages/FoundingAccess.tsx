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

export default function FoundingAccess() {
  useEffect(() => {
    document.title = "LIBRE Ride - Web3 Rideshare for Orlando";
    const description =
      "Join the founding driver program or request the investor deck for LIBRE Ride, the Web3 AI-powered rideshare platform built for Orlando.";
    setMeta("description", description);
    setMeta("og:title", "LIBRE Ride - Web3 Rideshare for Orlando", true);
    setMeta("og:description", description, true);
    setMeta("og:image", "/founding-orlando-skyline.png", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "LIBRE Ride - Web3 Rideshare for Orlando");
    setMeta("twitter:description", description);
    setMeta("twitter:image", "/founding-orlando-skyline.png");
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
          <div className="flex gap-3 text-slate-300">
            <Github className="h-5 w-5" />
            <Twitter className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
          </div>
        </div>
      </footer>
    </div>
  );
}
