import type { ScoredMarket } from "@/lib/markets";

function formatDuration(seconds: number): string {
  if (seconds < 60) return Math.max(0, Math.round(seconds)) + "s";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.max(0, Math.round(seconds % 60));
  return minutes + "m " + remaining + "s";
}

function formatPrice(price: number | undefined): string {
  return price === undefined ? "—" : Math.round(price * 100) + "¢";
}

function formatSpread(spread: number | undefined): string {
  return spread === undefined ? "—" : Math.round(spread * 100) + " pts";
}

export function MarketCard({ market }: { market: ScoredMarket }) {
  return (
    <article className="flex min-h-[360px] flex-col bg-bone-white p-7">
      <MarketCardHeader market={market} />
      <h3 className="mt-7 font-display text-[1.75rem] leading-[1.05] tracking-[-0.02em] text-press-black [text-wrap:balance]">
        {market.question}
      </h3>
      <MarketCardMetrics market={market} />
      <ul className="mt-auto space-y-2 border-t border-press-black/15 pt-6 text-body-sm text-newsprint-gray">
        {market.reasons.slice(0, 2).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </article>
  );
}

function MarketCardHeader({ market }: { market: ScoredMarket }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="eyebrow text-newsprint-gray">{market.asset}</span>
      <span className="rounded-pill bg-echo-green px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.11px] text-press-black">
        Ready
      </span>
    </div>
  );
}

function MarketCardMetrics({ market }: { market: ScoredMarket }) {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-press-black/15 pt-6">
      <div>
        <dt className="eyebrow text-newsprint-gray">Brink score</dt>
        <dd className="mt-2 font-display text-[2.5rem] leading-none text-press-black">
          {market.score.toFixed(1)}
        </dd>
      </div>
      <div>
        <dt className="eyebrow text-newsprint-gray">Best ask</dt>
        <dd className="mt-2 font-display text-[2.5rem] leading-none text-press-black">
          {formatPrice(market.bestAsk)}
        </dd>
      </div>
      <div>
        <dt className="eyebrow text-newsprint-gray">Spread</dt>
        <dd className="mt-2 text-body text-slate-verdant">
          {formatSpread(market.spread)}
        </dd>
      </div>
      <div>
        <dt className="eyebrow text-newsprint-gray">Time left</dt>
        <dd className="mt-2 text-body text-slate-verdant">
          {formatDuration(market.secondsLeft)}
        </dd>
      </div>
    </dl>
  );
}
