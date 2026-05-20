import { FoundingDriverForm } from "./FoundingDriverForm";
import { BadgeCheck, Gift, Headphones, IdCard, Plane, Users } from "lucide-react";

const benefits = [
  { title: "Founding Driver Badge", body: "Early reputation credential for approved pilot drivers.", Icon: BadgeCheck },
  { title: "Priority onboarding", body: "Move through pilot readiness before broad public launch.", Icon: IdCard },
  { title: "Reduced beta fees", body: "Potential reduced platform fees during controlled beta.", Icon: Gift },
  { title: "Driver feedback group", body: "Help shape tools, payouts, and compliance workflows.", Icon: Users },
  { title: "MCO eligibility path", body: "Airport interest can be flagged for operator review.", Icon: Plane },
  { title: "Early support access", body: "Closer support loop during the Orlando staging pilot.", Icon: Headphones },
];

export function LandingDriverProgram() {
  return (
    <section id="founding-driver-program" className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Founding drivers</p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">Become a Founding LIBRE Driver</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Help shape Orlando's next ride-sharing platform from the beginning. Founding drivers
            may receive early access, onboarding priority, beta benefits, reduced platform fees
            during pilot, referral rewards, and a voice in platform development.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefits.map(({ title, body, Icon }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Icon className="mb-4 h-6 w-6 text-cyan-200" />
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
        <FoundingDriverForm />
      </div>
    </section>
  );
}
