import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const links = [
  { href: "#founding-driver-program", label: "For Drivers" },
  { href: "#investor-section", label: "For Investors" },
  { href: "#technology", label: "Technology" },
  { href: "#demo", label: "Demo" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="text-xl font-black tracking-[0.18em] text-white">
          LIBRE
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-slate-300 hover:text-cyan-200">
              {link.label}
            </a>
          ))}
          <Button asChild className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400">
            <a href="#founding-driver-form">Apply Now</a>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-200"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button asChild className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400">
              <a href="#founding-driver-form" onClick={() => setOpen(false)}>
                Apply Now
              </a>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
