export function LandingComplianceNotice() {
  return (
    <section id="compliance" className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">Compliance-first notice</p>
        <h2 className="mt-3 text-3xl font-black md:text-4xl">Interest collection only</h2>
        <p className="mt-5 text-base leading-8 text-amber-50">
          LIBRE is not currently a licensed transportation company, securities issuer, insurance
          provider, or public token sale. This page is for interest collection, demo access, and
          founding program enrollment only. Driving operations, investment, token issuance, and
          insurance-like benefits require legal review and regulatory compliance before
          activation. Nothing on this page constitutes an offer to sell securities.
        </p>
        <div className="mt-6 grid gap-4 text-sm leading-6 text-amber-50/90 md:grid-cols-2">
          <p>
            Florida Statutes Section 627.748 includes TNC insurance requirements, including
            primary liability coverage during prearranged rides.
          </p>
          <p>
            SEC Regulation Crowdfunding requires compliant funding processes through registered
            intermediaries where applicable.
          </p>
        </div>
      </div>
    </section>
  );
}
