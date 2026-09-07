export function ApiSection() {
  return (
    <section id="api" className="bg-press-black py-20 text-bone-white lg:py-28">
      <div className="page-shell grid gap-12 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:gap-20">
        <div>
          <p className="eyebrow text-muted-sage">Read-only contract</p>
          <h2 className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.04em] text-bone-white [text-wrap:balance]">
            One endpoint. One snapshot.
          </h2>
          <p className="mt-7 max-w-[480px] text-body text-muted-sage">
            The list route returns normalized markets sorted by descending score.
            Each result carries quotes, spread, time left, tradeability, and the
            reasons behind the decision.
          </p>
        </div>
        <ApiContract />
      </div>
    </section>
  );
}

const responseFields = [
  "marketId / symbol / question / asset",
  "bestBid / bestAsk / spread / secondsLeft",
  "score / tradeable / reasons"
];

function ApiContract() {
  return (
    <div className="border border-bone-white/25 bg-slate-verdant/60 p-6 md:p-8">
      <p className="eyebrow text-highlighter-green">Request</p>
      <code className="mt-3 block text-body-sm text-bone-white">
        GET /v1/markets?tradeableOnly=true&amp;limit=3
      </code>

      <p className="mt-8 eyebrow text-highlighter-green">Each market returns</p>
      <pre className="mt-3 overflow-x-auto text-body-sm leading-relaxed text-muted-sage">
        <code>
          {responseFields.map((field) => (
            <span key={field} className="block">
              {field}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
