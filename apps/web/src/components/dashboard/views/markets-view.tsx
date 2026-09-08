import { useMemo, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import type { ScoredMarket } from "@/lib/markets";
import { formatDuration, formatCompact } from "@/lib/markets";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

type Filter = "all" | "tradeable" | "top";

export function MarketsView({
  markets,
  elapsed,
  onOpen
}: {
  markets: ScoredMarket[];
  elapsed: number;
  onOpen: (m: ScoredMarket) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets.filter((m) => {
      if (filter === "tradeable" && !m.tradeable) return false;
      if (filter === "top" && m.score < 80) return false;
      if (q && !(m.question.toLowerCase().includes(q) || m.asset.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [markets, query, filter]);

  return (
    <div>
      <PageHeader title="Markets" subtitle="Every live event contract, ranked by Brink score." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-[220px] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-sage/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets or assets…"
            className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 text-[13px] text-bone-white placeholder:text-muted-sage/40 focus:border-white/[0.12] focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-0.5">
          {(["all", "tradeable", "top"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-semibold capitalize transition-colors",
                filter === f ? "bg-white/[0.08] text-bone-white" : "text-muted-sage/60 hover:text-bone-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((m) => {
          const secondsLeft = Math.max(0, m.secondsLeft - elapsed);
          return (
            <button
              key={m.marketId}
              type="button"
              onClick={() => onOpen(m)}
              className={cn(PANEL, "group p-4 text-left transition-colors hover:border-white/[0.14] hover:bg-white/[0.03]")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-bone-white">
                    {m.asset.slice(0, 3)}
                  </span>
                  <span className="text-[12px] font-semibold text-bone-white">{m.asset}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-sage/30 transition group-hover:text-highlighter-green" />
              </div>
              <p className="mt-3 line-clamp-2 min-h-[36px] text-[13px] font-medium text-bone-white">{m.question}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">Score</p>
                  <p className="font-display text-[1.75rem] leading-none text-highlighter-green">{m.score.toFixed(1)}</p>
                </div>
                <div className="text-right text-[11px] text-muted-sage/70">
                  <p>{m.bestAsk ? Math.round(m.bestAsk * 100) + "¢" : "—"} ask · {m.spread === undefined ? "—" : Math.round(m.spread * 100) + " pts"}</p>
                  <p className="mt-0.5">{formatDuration(secondsLeft)} · ${formatCompact(m.volume)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.05] pt-3 text-[11px] text-muted-sage/70">
                <span className={cn("h-1.5 w-1.5 rounded-full", m.tradeable ? "bg-highlighter-green" : "bg-newsprint-gray")} />
                {m.tradeable ? "Tradeable" : m.status} · {m.reasons[0] ?? "—"}
              </div>
            </button>
          );
        })}
        {results.length === 0 && (
          <div className={cn(PANEL, "p-8 text-center sm:col-span-2 xl:col-span-3")}>
            <p className="text-[14px] text-muted-sage/60">No markets match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
