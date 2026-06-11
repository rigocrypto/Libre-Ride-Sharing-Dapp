import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { getWebSocketUrl } from '@/lib/websocket';
import { Web3Connect } from "@/components/Web3Connect";
import { EmailSignup } from "@/components/EmailSignup";
import { EarningsCalculator } from "@/components/EarningsCalculator";
import { SocialLogin } from "@/components/SocialLogin";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [onlineDrivers, setOnlineDrivers] = useState<number>(0);
  const [activeRides, setActiveRides] = useState<number>(0);
  const { toast } = useToast();

  // WebSocket connection for live stats
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      console.info('[WebSocket] Disabled: no backend WebSocket URL configured. Using polling fallback.');
      return;
    }

    const connect = () => {
      if (!isMounted) return;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[WebSocket] Connected for stats');
          // Send auth message (optional, but helps with connection stability)
          ws?.send(JSON.stringify({ type: 'stats_subscribe' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'stats_update' && data.stats) {
              setOnlineDrivers(data.stats.onlineDrivers || 0);
              setActiveRides(data.stats.activeRides || 0);
            }
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected', { code: event.code, reason: event.reason });
          ws = null;
          
          // Only reconnect if component is still mounted and it wasn't a clean close
          if (isMounted && event.code !== 1000) {
            reconnectTimeout = setTimeout(() => {
              console.log('[WebSocket] Reconnecting...');
              connect();
            }, 3000);
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        if (isMounted) {
          reconnectTimeout = setTimeout(() => connect(), 5000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, []);

  const waitlistMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/waitlist", { email, userType: "rider" });
      return await res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setEmail('');
      toast({
        title: "You're on the list!",
        description: "We'll notify you when Libre launches in Orlando.",
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      waitlistMutation.mutate(email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-indigo-500/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            🏎️ Libre
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/rider" className="hover:text-indigo-300 transition px-4 py-2 rounded-lg border border-indigo-500/50">
              Rider
            </Link>
            <Link href="/become-driver" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                Become a Driver 🚀
            </Link>
            <Link href="/founding-access" className="hidden rounded-lg border border-cyan-400/50 px-4 py-2 transition hover:text-cyan-200 md:inline-block">
              Founding Access
            </Link>
            <Web3Connect />
          </div>
        </div>
      </nav>

      {/* Hero - Split Audience */}
      <section className="relative pt-28 pb-32 px-6 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
        </div>

        {/* Floating glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative max-w-6xl mx-auto text-center z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
            Ride libre.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Keep what you earn.
            </span>
          </h1>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
            Keep 97% of every fare. Get paid instantly. Florida-licensed & insured.
            <br />
            <span className="text-lg text-white/60">Fairer ridesharing for drivers and riders.</span>
          </p>

          {/* Split CTA - Rider vs Driver */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {/* Rider Card */}
            <div className="group p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer">
              <div className="text-5xl mb-4 animate-bounce group-hover:animate-none">🧍‍♂️</div>
              <h3 className="text-2xl font-bold mb-2">For Riders</h3>
              <p className="text-white/80 mb-6">
                Transparent pricing, safer rides, and instant rewards. No surge pricing surprises.
              </p>
              <Link href="/rider" className="inline-block px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold w-full text-center">
                Request a Ride →
              </Link>
            </div>

            {/* Driver Card */}
            <div className="group p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer">
              <div className="text-5xl mb-4 animate-bounce group-hover:animate-none">🚗</div>
              <h3 className="text-2xl font-bold mb-2">For Drivers</h3>
              <p className="text-white/80 mb-4">
                Keep 97% of every fare. Get paid instantly after each ride. Fully Florida-compliant.
              </p>
              <p className="text-sm text-emerald-300/80 mb-4">
                LIBRE only shows you rides after payment is escrow-confirmed — no wasted trips.
              </p>
              <Link href="/become-driver" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition font-bold w-full text-center mb-3">
                Start Driving 🚀
              </Link>
              <Link href="/driver" className="inline-block px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-emerald-400/30 transition font-semibold w-full text-center text-emerald-200 text-sm">
                Try the Driver Demo →
              </Link>
            </div>
          </div>

          {/* Demo CTA Banner */}
          <div className="max-w-3xl mx-auto mb-10 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-md border border-emerald-500/30">
            <div className="flex items-center justify-center mb-3">
              <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-medium">
                Demo Mode · Base Sepolia · No real funds
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">Try the Live Demo</h3>
            <p className="text-center text-white/70 text-sm mb-5">
              See how escrow-confirmed rides protect drivers, riders, and platform operators.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/rider" className="flex-1 sm:flex-none inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition font-bold text-center">
                🧍 Rider Demo
              </Link>
              <Link href="/driver" className="flex-1 sm:flex-none inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition font-semibold text-center">
                🚗 Driver Demo
              </Link>
              <Link href="/admin" className="flex-1 sm:flex-none inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition font-semibold text-center">
                📊 Admin Demo
              </Link>
            </div>
          </div>

          {/* Primary CTA: Social Login */}
          <div className="max-w-md mx-auto mb-8">
            <div className="space-y-4">
              <SocialLogin 
                context="landing"
                onSuccess={(address) => {
                  track('landing_social_login_success', { address });
                  // Redirect to rider page
                  window.location.href = '/rider';
                }}
                size="lg"
                variant="default"
              />
              
              <p className="text-sm opacity-70 text-center text-white/80">
                No crypto required. Wallet created automatically.
              </p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-indigo-900/50 px-2 text-white/60">Or join waitlist</span>
              </div>
            </div>

            {/* Waitlist Form */}
            {!submitted ? (
              <form onSubmit={handleWaitlistSubmit} className="flex w-full">
                <input
                  type="email"
                  placeholder="Join Waitlist: your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white placeholder-white/70"
                  required
                  disabled={waitlistMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={waitlistMutation.isPending}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-8 py-4 rounded-r-xl font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap disabled:opacity-50"
              >
                  {waitlistMutation.isPending ? "Joining..." : "Join"}
                </button>
              </form>
            ) : (
              <div className="bg-green-500/20 border border-green-400 px-8 py-4 rounded-xl font-semibold">
                ✅ Thanks! You're on the list.
              </div>
            )}
            <p className="text-xs text-white/60 text-center mt-3">
              Or <Link href="/become-driver" className="text-indigo-400 hover:underline">sign up as a driver</Link> to start earning instantly
            </p>
            <div className="mt-4 text-center">
              <p className="text-sm text-white/70">
                💰 <strong>Refer a driver → Both earn $50</strong>
              </p>
            </div>
          </div>

          {/* Live Stats */}
          {onlineDrivers > 0 && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-2xl">🚗</span>
                <span className="text-lg font-semibold">
                  <span className="text-indigo-300">{onlineDrivers}</span> Drivers Online in Orlando
                </span>
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
            <span>✅ Florida TNC Compliant</span>
            <span>✅ Base Network</span>
            <span>✅ Instant Payouts</span>
            <span>✅ Orlando‑First</span>
          </div>
        </div>
      </section>

      {/* Earnings Calculator Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-black/20 to-indigo-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 text-white">See How Much More You Could Earn</h2>
            <p className="text-xl text-white/70">
              Compare your potential earnings with Libre vs. traditional rideshare platforms
            </p>
          </div>
          <EarningsCalculator />
        </div>
      </section>

      {/* How It Works - Simple 3 Steps */}
      <section className="py-24 px-6 bg-black/20">
        <h2 className="text-4xl font-black text-center mb-16 text-white">How Libre Works</h2>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          {[
            { icon: '📲', title: 'Request or Go Online', desc: 'Riders request rides. Drivers go online.' },
            { icon: '⚡', title: 'Smart Matching', desc: 'Real‑time matching with verified, compliant drivers.' },
            { icon: '💸', title: 'Get Paid Instantly', desc: 'Transparent pricing. Instant payouts after every ride.' },
          ].map((step, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:scale-105 transition-all group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{step.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
              <p className="text-white/70">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How the LIBRE Demo Works */}
      <section className="py-24 px-6 bg-gradient-to-b from-emerald-900/20 to-cyan-900/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-medium mb-4">
              Live Demo Available
            </span>
            <h2 className="text-4xl font-black text-white mb-4">How the LIBRE Demo Works</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              This demo runs the full escrow-gated ride lifecycle — no real passengers, no real funds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {[
              {
                step: '1',
                icon: '🔒',
                title: 'Rider locks payment',
                desc: 'The rider requests a ride, receives an Orlando fare estimate, and confirms escrow payment before the ride is offered to any driver.',
                cta: 'Try Rider Demo',
                href: '/rider',
              },
              {
                step: '2',
                icon: '🚗',
                title: 'Driver sees confirmed rides only',
                desc: 'Drivers only see rides after escrow is confirmed, eliminating wasted time on unconfirmed or unpaid trips.',
                cta: 'Try Driver Demo',
                href: '/driver',
              },
              {
                step: '3',
                icon: '📊',
                title: 'Admin tracks the lifecycle',
                desc: 'The admin view shows ride status, escrow state, driver assignment, fare breakdown, and transaction reference.',
                cta: 'Try Admin Demo',
                href: '/admin',
              },
            ].map((card) => (
              <div
                key={card.step}
                className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all hover:scale-105 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 bg-emerald-500/30 text-emerald-300 rounded-full flex items-center justify-center text-sm font-black">
                    {card.step}
                  </span>
                  <span className="text-3xl">{card.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-white/70 text-sm flex-1 mb-5">{card.desc}</p>
                <Link
                  href={card.href}
                  className="inline-block text-center px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-sm font-semibold transition"
                >
                  {card.cta} →
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-white/60 text-sm italic">
            This demo shows LIBRE's core trust layer: escrow-gated ride matching.
            Drivers only see payment-confirmed rides.
          </p>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-white">Drivers Love Libre</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Making $1,200/week vs $800 on Uber. Game changer.", 
                name: "Carlos M.", 
                location: "Orlando",
                rating: 5 
              },
              { 
                quote: "Instant payouts. No more waiting until Friday.", 
                name: "Sarah K.", 
                location: "Disney Driver",
                rating: 5 
              },
              {
                quote: "Compliance handled automatically. Zero stress.", 
                name: "Mike T.", 
                location: "Airport Runs",
                rating: 5 
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-8 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <p className="mb-6 opacity-90 text-white/80 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mr-4 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-white/60">{testimonial.location}</p>
                    <div className="flex gap-1 text-yellow-400 mt-1">
                      {'★'.repeat(testimonial.rating)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Summary Cards */}
      <section className="px-6 md:px-12 lg:px-24 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-purple-500/20 backdrop-blur-md border border-indigo-500/30">
            <h3 className="text-3xl font-black mb-2">19 Tables</h3>
            <p>Drizzle ORM Schema</p>
          </div>
          <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/30">
            <h3 className="text-3xl font-black mb-2">30+ Endpoints</h3>
            <p>Full API Ready</p>
          </div>
          <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-orange-500/20 to-red-500/20 backdrop-blur-md border border-orange-500/30">
            <h3 className="text-3xl font-black mb-2">100% FL Compliant</h3>
            <p>Orlando TNC Rules</p>
          </div>
            </div>
      </section>

      {/* Architecture */}
      <section className="px-6 md:px-12 lg:px-24 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">🏗️ Architecture</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Tech Stack</h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-white/5 rounded-xl">
                  <span className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mr-4 font-bold">FE</span>
                  <span>React 18 • Vite • TS • Tailwind • Wagmi v3</span>
                    </div>
                <div className="flex items-center p-4 bg-white/5 rounded-xl">
                  <span className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4 font-bold">BE</span>
                  <span>Express • Drizzle • WS • UploadThing</span>
                    </div>
                <div className="flex items-center p-4 bg-white/5 rounded-xl">
                  <span className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4 font-bold">Web3</span>
                  <span>Instant Payouts • Secure Payments</span>
                  </div>
              </div>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
              <h3 className="text-2xl font-bold mb-6">Project Structure</h3>
              <pre className="text-xs bg-black/50 p-6 rounded-xl overflow-auto font-mono max-h-80">
{`RideShareDapp/
├── client/     # React SPA
├── server/     # Express API
├── shared/     # Types/Schema
├── contracts/  # Solidity
└── dev-tools/  # Mocks`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Enhanced with Motion */}
      <section className="px-6 md:px-12 lg:px-24 py-20 bg-gradient-to-b from-purple-900/50 to-indigo-900/50">
        <h2 className="text-4xl font-black mb-12 text-center text-white">✨ Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {[
            { icon: '👤', title: 'User Mgmt', desc: 'Wallet auth, profiles, waitlist' },
            { icon: '🚗', title: 'Driver Onboard', desc: 'Photos, docs, compliance' },
            { icon: '🗺️', title: 'Ride Flow', desc: 'Request → Match → Track → Complete' },
            { icon: '✅', title: 'FL Compliance', desc: 'License, vehicle, insurance, Orlando permit' },
            { icon: '📤', title: 'Docs Upload', desc: 'UploadThing, SHA256, OCR ready' },
            { icon: '⚡', title: 'WebSocket RT', desc: 'Presence, matching, updates' },
            { icon: '💳', title: 'Fair Payments', desc: 'Keep 97% of every fare. Instant payouts.' },
            { icon: '🔔', title: 'Notifications', desc: 'Email/SMS/Push (Resend/Twilio)' },
            { icon: '🎖️', title: 'Rewards', desc: 'Badges, referrals, cashback' },
          ].map((feat, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all hover:scale-105 hover:-rotate-1 group cursor-pointer">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feat.icon}</div>
              <h4 className="text-xl font-bold mb-2 text-white">{feat.title}</h4>
              <p className="opacity-90 text-white/80">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance + Trust - Human Language */}
      <section className="px-6 md:px-12 lg:px-24 py-20 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">Fully Licensed & Insured</h2>
          <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto">
            Libre meets all Florida rideshare requirements. Every driver is background-checked,
            every vehicle is inspected, and every ride is covered by $1M insurance — automatically handled.
          </p>

          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              'Background Checks',
              'Vehicle Inspections',
              '$1M Ride Insurance',
              'Airport Fees Handled',
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/20 backdrop-blur-md font-semibold hover:scale-105 transition-transform">
                ✅ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API & Schema Accordion (Collapsible for UX) */}
      <section className="px-6 md:px-12 lg:px-24 py-20">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-black mb-6">📊 19-Table Schema</h2>
            <p className="opacity-75 mb-6">users, drivers, rides, compliance_*, documents_*, sos_alerts...</p>
          </div>
          <details className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <summary className="cursor-pointer font-bold text-xl mb-4">API Endpoints (30+)</summary>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Auth/Users:</strong><br/>
                POST /api/waitlist<br/>
                POST /api/users/attach-wallet
              </div>
              <div>
                <strong>Rides:</strong><br/>
                POST /api/rides<br/>
                POST /api/rides/:id/complete
              </div>
            <div>
                <strong>Drivers:</strong><br/>
                POST /api/drivers<br/>
                POST /api/driver/approve
                </div>
              <div>
                <strong>Uploads:</strong><br/>
                POST /api/upload/license<br/>
                POST /api/upload/vehicle
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Roadmap */}
      <section className="px-6 md:px-12 lg:px-24 py-20 bg-black/20">
        <h2 className="text-4xl font-black mb-12 text-center">🚀 Roadmap</h2>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center p-6 bg-green-500/20 rounded-2xl border-l-4 border-green-500">
            <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold mr-6 text-sm">✅</span>
            <div>
              <h4 className="font-bold">MVP v0.4</h4>
              <p>Core implemented, server live!</p>
            </div>
          </div>
          <div className="flex items-center p-6 bg-yellow-500/20 rounded-2xl border-l-4 border-yellow-500">
            <span className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold mr-6 text-sm">⚠️</span>
            <div>
              <h4 className="font-bold">v0.5</h4>
              <p>Drizzle, payments, AA wiring</p>
            </div>
          </div>
          <div className="flex items-center p-6 bg-blue-500/20 rounded-2xl border-l-4 border-blue-500">
            <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold mr-6 text-sm">⏳</span>
            <div>
              <h4 className="font-bold">v1.0 Launch</h4>
              <p>Prod deploy, Orlando beta</p>
            </div>
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="px-6 md:px-12 lg:px-24 py-20">
        <h2 className="text-3xl font-black mb-12 text-center">🔧 Quick Start</h2>
        <div className="max-w-2xl mx-auto bg-gradient-to-b from-gray-800/50 to-black/50 p-8 rounded-3xl backdrop-blur-md border border-white/10">
          <pre className="text-xs font-mono bg-black/30 p-6 rounded-2xl mb-6 overflow-auto">
{`pnpm install
STORAGE_ENGINE=mem pnpm dev
# http://localhost:5000`}
          </pre>
          <p className="text-center opacity-75">MemStorage for dev. Drizzle ready.</p>
        </div>
      </section>

      {/* Big CTA Footer - Drivers Page Link */}
      <footer className="px-6 md:px-12 lg:px-24 py-20 text-center bg-gradient-to-t from-black to-transparent">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-8 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Ready to Drive?
          </h2>
          <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            Keep 97% of every fare. Get paid instantly. Full compliance. Orlando market. Join 100+ drivers in waitlist.
          </p>
          <Link href="/become-driver" className="block w-full max-w-md mx-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-xl px-12 py-8 rounded-3xl font-black shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
              🚀 Start Driver Onboarding
          </Link>
          <div className="mt-12 text-sm opacity-50 space-y-2">
            <p>Last Updated: Dec 2024 | v0.4 MVP</p>
            <p>Libre © 2024 | Fairer Ridesharing</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Driver CTA */}
      <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
        <Link href="/become-driver" className="block text-center bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-black shadow-xl hover:shadow-2xl transition-all">
            🚗 Start Driving with Libre
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
