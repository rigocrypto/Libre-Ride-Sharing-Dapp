import { Link } from "wouter";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white md:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/founding-access" className="text-sm text-cyan-200">
          Back to Founding Access
        </Link>
        <h1 className="mt-6 text-4xl font-black">LIBRE Privacy Notice</h1>
        <p className="mt-4 text-slate-300">
          LIBRE collects founding driver, investor, sponsor, and partner interest information so the team can evaluate Orlando pilot demand and follow up with qualified applicants.
        </p>
        <section className="mt-8 space-y-4 text-slate-300">
          <h2 className="text-2xl font-bold text-white">Information collected</h2>
          <p>
            Forms may collect name, email, phone, city, driver experience, vehicle information, referral source, investor or partner interest, and consent acknowledgments.
          </p>
          <h2 className="text-2xl font-bold text-white">How it is used</h2>
          <p>
            Information is used for pilot follow-up, demo access, founding driver review, partner conversations, and future compliant funding interest collection. LIBRE does not sell lead data.
          </p>
          <h2 className="text-2xl font-bold text-white">Important notice</h2>
          <p>
            Submitting a form does not guarantee driver approval, ride volume, earnings, employment, equity, token value, investment access, or partnership acceptance.
          </p>
          <h2 className="text-2xl font-bold text-white">Contact</h2>
          <p>
            For privacy questions or removal requests, contact <a className="text-cyan-200" href="mailto:hello@libreride.local">hello@libreride.local</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
