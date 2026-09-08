import { useMemo, useState } from "react";
import { Radar, ArrowUpRight } from "lucide-react";
import type { ScoredMarket } from "@/lib/markets";
import { formatDuration } from "@/lib/markets";
import { PremiumToggle } from "@/components/ui/bouncy-toggle";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

export function ScannerView({
  markets,
  elapsed,
  onOpen
}: {
  markets: ScoredMarket[];
  elapsed: number;
  onOpen: (m: ScoredMarket) => void;
}) {
  const [minScore, setMinScore] = useState(60);
  const [maxSpread, setMaxSpread] = useState(8);
  const [minMinutes, setMinMinutes] = useState(5);
  const [tradeableOnly, setTradeableOnly] = useState(true);

  const results = useMemo(
    () =>
      markets.filter((m) => {
        const secondsLeft = Math.max(0, m.secondsLeft - elapsed);
        const spreadPts = m.spread === undefined ? 99 : Math.round(m.spread * 100);
        if (m.score < minScore) return false;
        if (spreadPts > maxSpread) return false;
        if (secondsLeft < minMinutes * 60) return false;
        if (tradeableOnly && !m.tradeable) return false;
        return true;
      }),
    [markets, elapsed, minScore, maxSpread, minMinutes, tradeableOnly]
  );

  return (
    <div>
      <PageHeader title="Scanner" subtitle="Set your gates. Brink surfaces the markets that clear them." />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className={cn(PANEL, "h-fit p-5")}>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">
            <Radar className="h-4 w-4 text-highlighter-green" /> Filters
          </div>
          <div className="mt-5 space-y-6">
            <Slider label="Min score" value={minScore} min={0} max={100} suffix="" onChange={setMinScore} />
            <Slider label="Max spread" value={maxSpread} min={1} max={30} suffix=" pts" onChange={setMaxSpread} />
            <Slider label="Min time left" value={minMinutes} min={0} max={60} suffix="m" onChange={setMinMinutes} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-bone-white">Tradeable only</p>
                <p className="text-[11px] text-muted-sage/50">Passes every safety gate</p>
              </div>
              <PremiumToggle defaultChecked={tradeableOnly} onChange={setTradeableOnly} />
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-highlighter-green/[0.06] px-3 py-2 text-center text-[12px] text-highlighter-green">
            {results.length} market{results.length === 1 ? "" : "s"} match
          </div>
        </div>

        <div className={cn(PANEL, "overflow-hidden")}>
          {results.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-muted-sage/60">Loosen a gate — nothing clears these yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {results.map((m) => {
                const secondsLeft = Math.max(0, m.secondsLeft - elapsed);
                return (
                  <button
                    key={m.marketId}
                    type="button"
                    onClick={() => onOpen(m)}
                    className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-bone-white">
                      {m.asset.slice(0, 3)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-bone-white">{m.question}</span>
                      <span className="text-[11px] text-muted-sage/55">
                        {m.spread === undefined ? "—" : Math.round(m.spread * 100) + " pts"} · {formatDuration(secondsLeft)}
                      </span>
                    </span>
                    <span className="font-display text-[1.4rem] leading-none text-highlighter-green">{m.score.toFixed(1)}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-sage/30 group-hover:text-highlighter-green" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-bone-white">{label}</span>
        <span className="text-[13px] font-semibold tabular-nums text-highlighter-green">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.1] accent-highlighter-green"
      />
    </div>
  );
}
