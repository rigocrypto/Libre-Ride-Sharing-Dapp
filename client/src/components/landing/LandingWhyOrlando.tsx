import { Building2, Castle, Landmark, Plane, Star, TentTree } from "lucide-react";

const points = [
  { title: "75M+ annual visitors", body: "Tourism keeps local mobility demand active year round.", Icon: Star },
  { title: "Orlando International Airport", body: "MCO is a powerful anchor for airport and hotel rides.", Icon: Plane },
  { title: "Disney and Universal", body: "Theme parks create predictable family and tourist transport needs.", Icon: Castle },
  { title: "Convention traffic", body: "Orange County Convention Center brings recurring event demand.", Icon: Building2 },
  { title: "I-Drive and hotels", body: "Dense hospitality corridors make Orlando a practical pilot market.", Icon: TentTree },
  { title: "Local driver market", body: "A deep independent driver community already understands TNC work.", Icon: Landmark },
];

export function LandingWhyOrlando() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">Why Orlando</p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">Why Orlando Is the Right First Market</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Orlando is one of the strongest pilot markets for a next-generation ride-sharing
            platform because tourism, airport rides, hotels, events, and local transportation
            demand create constant mobility needs.
          </p>
          <img
            src={`${import.meta.env.BASE_URL}founding-fleet-collage.png`}
            alt="Modern rideshare vehicles in an Orlando-inspired visual collage"
            className="mt-8 aspect-[16/10] w-full rounded-3xl border border-white/10 object-cover shadow-2xl shadow-black/30"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {points.map(({ title, body, Icon }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <Icon className="mb-4 h-6 w-6 text-violet-200" />
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
