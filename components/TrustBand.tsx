export default function TrustBand() {
 const pillars = [
  "Real photo analysis",
  "Grounded project estimates",
  "Contractor-ready scope briefs",
  "Designed to reduce quote confusion",
 ];

 return (
  <section className="relative z-10 border-y border-hairline bg-canvas-50 px-6 py-12 md:px-10">
   <div className="mx-auto max-w-7xl">
    <div className="mb-6 flex items-center justify-center gap-2">
     <div className="h-px w-8 bg-panel" />
     <span className="mono-label">what naili actually does</span>
     <div className="h-px w-8 bg-panel" />
    </div>
    <div className="flex flex-wrap items-center justify-center gap-3">
     {pillars.map((pillar) => (
      <div key={pillar} className="inline-flex items-center gap-2 rounded-full border border-panel bg-white px-4 py-2 text-sm text-ink-600 shadow-soft">
       <span className="h-1.5 w-1.5 rounded-full bg-mint" />
       <span>{pillar}</span>
      </div>
     ))}
    </div>
   </div>
  </section>
 );
}
