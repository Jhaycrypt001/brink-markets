import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RefreshCw, Loader2, Coins, TrendingUp } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { fetchPositions, redeemPosition, type Position } from "@/lib/trade";
import { useNotifications } from "@/components/dashboard/notifications";
import { cn } from "@/lib/utils";

const PANEL = "rounded-xl border border-white/[0.06] bg-white/[0.015]";
const cents = (p: number | null) => (p === null ? "—" : Math.round(p * 100) + "¢");
const usd = (v: number | null) => (v === null ? "—" : (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2));

/**
 * PositionsPnl — the wallet's real outcome-token holdings with avg-cost PnL, and
 * a Redeem action to collect winnings once a market resolves. Holdings, mark
 * price, and redemption are all on-chain; nothing is mocked.
 */
export function PositionsPnl() {
  const account = useActiveAccount();
  const inbox = useNotifications();
  const [positions, setPositions] = useState<Position[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!account) return;
    try {
      setPositions(await fetchPositions(account));
      setState("ready");
    } catch {
      setState("error");
    }
  }, [account]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(id);
  }, [load]);

  async function redeem(p: Position) {
    if (!account) return;
    setRedeeming(p.symbol);
    setNote(null);
    try {
      await redeemPosition(account, p.marketRef, p.shares);
      inbox.push("Redeemed", `${p.shares} ${p.outcome} · ${tidy(p.marketRef)}`);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redeem failed.";
      setNote(
        /resolve|settle|MarketNotSettled|not.*settl/i.test(msg)
          ? "That market hasn't resolved yet — you can redeem winnings once it settles."
          : msg
      );
    } finally {
      setRedeeming(null);
    }
  }

  const totalValue = positions.reduce((s, p) => s + (p.value ?? 0), 0);
  const totalPnl = positions.reduce((s, p) => s + (p.unrealizedPnl ?? 0), 0);
  const marked = positions.some((p) => p.unrealizedPnl !== null);

  return (
    <div className={cn(PANEL, "overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">
          <TrendingUp className="h-4 w-4 text-highlighter-green" /> Positions
        </div>
        <div className="flex items-center gap-5">
          {marked && (
            <>
              <Metric label="Value" value={usd(totalValue)} />
              <Metric
                label="Unrealized P&L"
                value={usd(totalPnl)}
                tone={totalPnl > 0 ? "up" : totalPnl < 0 ? "down" : undefined}
              />
            </>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md p-1.5 text-muted-sage/50 hover:bg-white/[0.05] hover:text-bone-white"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", state === "loading" && "animate-spin")} />
          </button>
        </div>
      </div>

      {note && (
        <p className="border-b border-white/[0.06] bg-highlighter-green/[0.05] px-4 py-2 text-[12px] text-muted-sage/80">{note}</p>
      )}

      {state === "error" ? (
        <Empty text="Couldn't load your positions. Refresh to retry." />
      ) : positions.length === 0 ? (
        <Empty text={state === "loading" ? "Loading positions…" : "No positions yet. Buy a market and your holdings appear here with live P&L."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-sage/40">
                <Th className="pl-4">Position</Th>
                <Th>Shares</Th>
                <Th>Avg</Th>
                <Th>Mark</Th>
                <Th>Value</Th>
                <Th>P&L</Th>
                <Th className="pr-4 text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const pnl = p.unrealizedPnl;
                const pct = p.costBasis && p.costBasis > 0 && pnl !== null ? (pnl / p.costBasis) * 100 : null;
                return (
                  <tr key={p.symbol} className="border-t border-white/[0.04]">
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <OutcomeTag outcome={p.outcome} />
                        <span className="text-bone-white">{tidy(p.marketRef)}</span>
                      </div>
                    </td>
                    <td className="tabular-nums text-muted-sage/80">{p.shares}</td>
                    <td className="tabular-nums text-muted-sage/80">{cents(p.avgCost)}</td>
                    <td className="tabular-nums text-bone-white">{cents(p.markPrice)}</td>
                    <td className="tabular-nums text-bone-white">{usd(p.value)}</td>
                    <td className={cn("tabular-nums font-semibold", pnl === null ? "text-muted-sage/60" : pnl >= 0 ? "text-highlighter-green" : "text-[#e08a8a]")}>
                      {pnl === null ? "—" : `${usd(pnl)}${pct !== null ? ` (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)` : ""}`}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => void redeem(p)}
                        disabled={redeeming === p.symbol}
                        className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-muted-sage/80 hover:text-bone-white disabled:opacity-50"
                      >
                        {redeeming === p.symbol ? <Loader2 className="h-3 w-3 animate-spin" /> : <Coins className="h-3 w-3" />}
                        Redeem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">{label}</p>
      <p className={cn("text-[13px] font-semibold tabular-nums", tone === "up" ? "text-highlighter-green" : tone === "down" ? "text-[#e08a8a]" : "text-bone-white")}>
        {value}
      </p>
    </div>
  );
}

function OutcomeTag({ outcome }: { outcome: "YES" | "NO" }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", outcome === "YES" ? "bg-highlighter-green/15 text-highlighter-green" : "bg-[#e08a8a]/15 text-[#e08a8a]")}>
      {outcome}
    </span>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-2 py-2.5 font-semibold first:pl-4", className)}>{children}</th>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-[13px] text-muted-sage/50">{text}</div>;
}

function tidy(symbol: string): string {
  return symbol.length > 30 ? symbol.slice(0, 28) + "…" : symbol;
}
