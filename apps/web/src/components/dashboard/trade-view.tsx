import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import type { ScoredMarket } from "@/lib/markets";
import { formatDuration, formatCompact } from "@/lib/markets";
import { PriceChart } from "./price-chart";
import { OrderBook } from "./order-book";
import { TradeTicket } from "./trade-ticket";
import { OpenOrdersStrip, useOpenOrders } from "./positions-panel";
import type { PricePoint } from "./use-market-feed";
import { cn } from "@/lib/utils";

const PANEL = "rounded-xl border border-white/[0.06] bg-white/[0.015]";

export function TradeView({
  markets,
  selected,
  onSelect,
  elapsed,
  history
}: {
  markets: ScoredMarket[];
  selected: ScoredMarket;
  onSelect: (market: ScoredMarket) => void;
  elapsed: number;
  history: PricePoint[];
}) {
  const account = useActiveAccount();
  const openOrders = useOpenOrders(account);
  const marketOrders = useMemo(
    () => openOrders.orders.filter((o) => o.symbol === selected.symbol),
    [openOrders.orders, selected.symbol]
  );

  return (
    <div className="space-y-4">
      <MarketHeader market={selected} elapsed={elapsed} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn(PANEL, "min-h-[320px] overflow-hidden")}>
          <PriceChart market={selected} history={history} />
        </div>
        <div className="grid gap-4">
          <div className={cn(PANEL, "overflow-hidden")}>
            <OrderBook market={selected} myOrders={marketOrders} />
          </div>
          <div className={cn(PANEL, "overflow-hidden")}>
            <TradeTicket market={selected} />
          </div>
        </div>
      </div>

      <OpenOrdersStrip {...openOrders} />

      <MarketsTable markets={markets} selected={selected} onSelect={onSelect} elapsed={elapsed} />
    </div>
  );
}

function MarketHeader({ market, elapsed }: { market: ScoredMarket; elapsed: number }) {
  const yes = Math.round((market.bestAsk ?? 0.5) * 100);
  const secondsLeft = Math.max(0, market.secondsLeft - elapsed);

  return (
    <div className={cn(PANEL, "flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3")}>
      <button type="button" className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.05]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-bone-white">
          {market.asset.slice(0, 3)}
        </span>
        <div>
          <p className="text-[13px] font-semibold text-bone-white">{market.asset} · Event</p>
          <p className="max-w-[220px] truncate text-[11px] text-muted-sage/60">{market.question}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-sage/50" />
      </button>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-[1.75rem] leading-none tracking-[-0.03em] text-bone-white tabular-nums">
          {yes}¢
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-sage/45">YES</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Stat label="Best bid" value={market.bestBid ? Math.round(market.bestBid * 100) + "¢" : "—"} tone="accent" />
        <Stat label="Best ask" value={market.bestAsk ? Math.round(market.bestAsk * 100) + "¢" : "—"} />
        <Stat label="Spread" value={market.spread === undefined ? "—" : Math.round(market.spread * 100) + " pts"} />
        <Stat label="Volume" value={"$" + formatCompact(market.volume)} />
        <Stat label="Brink Score" value={market.score.toFixed(1)} tone="accent" />
        <Stat label="Expiry" value={formatDuration(secondsLeft)} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  const color = tone === "accent" ? "text-highlighter-green" : "text-bone-white";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">{label}</p>
      <p className={cn("mt-0.5 text-[13px] font-semibold tabular-nums", color)}>{value}</p>
    </div>
  );
}

const TABS = ["Markets", "Reasons", "Depth"] as const;

function MarketsTable({
  markets,
  selected,
  onSelect,
  elapsed
}: {
  markets: ScoredMarket[];
  selected: ScoredMarket;
  onSelect: (m: ScoredMarket) => void;
  elapsed: number;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Markets");

  return (
    <div className={cn(PANEL, "overflow-hidden")}>
      <div className="flex items-center gap-1 border-b border-white/[0.06] px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors",
              tab === t ? "bg-white/[0.06] text-bone-white" : "text-muted-sage/60 hover:text-bone-white"
            )}
          >
            {t}
            {t === "Markets" && (
              <span className="ml-1.5 text-[10px] text-muted-sage/40">{markets.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "Markets" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-sage/40">
                <Th className="pl-4">Market</Th>
                <Th>Score</Th>
                <Th>Bid</Th>
                <Th>Ask</Th>
                <Th>Spread</Th>
                <Th>Time left</Th>
                <Th>Volume</Th>
                <Th className="pr-4">Status</Th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => {
                const active = m.marketId === selected.marketId;
                const secondsLeft = Math.max(0, m.secondsLeft - elapsed);
                return (
                  <tr
                    key={m.marketId}
                    onClick={() => onSelect(m)}
                    className={cn(
                      "cursor-pointer border-t border-white/[0.04] text-[12px] transition-colors",
                      active ? "bg-highlighter-green/[0.06]" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <span className={cn("h-4 w-0.5 rounded-full", active ? "bg-highlighter-green" : "bg-transparent")} />
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-bone-white">
                          {m.asset.slice(0, 3)}
                        </span>
                        <span className="max-w-[240px] truncate font-medium text-bone-white">{m.question}</span>
                      </div>
                    </td>
                    <td><span className="font-semibold tabular-nums text-highlighter-green">{m.score.toFixed(1)}</span></td>
                    <td className="tabular-nums text-muted-sage/80">{m.bestBid ? Math.round(m.bestBid * 100) + "¢" : "—"}</td>
                    <td className="tabular-nums text-bone-white">{m.bestAsk ? Math.round(m.bestAsk * 100) + "¢" : "—"}</td>
                    <td className="tabular-nums text-muted-sage/80">{m.spread === undefined ? "—" : Math.round(m.spread * 100) + " pts"}</td>
                    <td className="tabular-nums text-muted-sage/80">{formatDuration(secondsLeft)}</td>
                    <td className="tabular-nums text-muted-sage/80">${formatCompact(m.volume)}</td>
                    <td className="pr-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        m.tradeable ? "bg-highlighter-green/12 text-highlighter-green" : "bg-white/[0.05] text-muted-sage/70"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", m.tradeable ? "bg-highlighter-green" : "bg-newsprint-gray")} />
                        {m.tradeable ? "Tradeable" : m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Reasons" && (
        <ul className="space-y-2 p-4">
          {selected.reasons.map((r) => (
            <li key={r} className="flex items-center gap-2.5 text-[13px] text-muted-sage/80">
              <span className="h-1.5 w-1.5 rounded-full bg-highlighter-green" />
              {r}
            </li>
          ))}
        </ul>
      )}

      {tab === "Depth" && (
        <div className="grid grid-cols-2 gap-4 p-4 text-[13px]">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">Best bid</p>
            <p className="mt-1 font-semibold tabular-nums text-highlighter-green">{selected.bestBid ? Math.round(selected.bestBid * 100) + "¢" : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">Best ask</p>
            <p className="mt-1 font-semibold tabular-nums text-bone-white">{selected.bestAsk ? Math.round(selected.bestAsk * 100) + "¢" : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">Trades</p>
            <p className="mt-1 font-semibold tabular-nums text-bone-white">{formatCompact(selected.tradeCount)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">Volume</p>
            <p className="mt-1 font-semibold tabular-nums text-bone-white">${formatCompact(selected.volume)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-2 py-2 font-semibold first:pl-4", className)}>{children}</th>;
}
