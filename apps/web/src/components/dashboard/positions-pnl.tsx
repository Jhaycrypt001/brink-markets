import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RefreshCw, Loader2, Coins, TrendingUp, Share2, LogOut } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { fetchPositions, redeemPosition, placeBrinkOrder, type Position } from "@/lib/trade";
import { useNotifications } from "@/components/dashboard/notifications";
import { PnlCardModal } from "@/components/dashboard/pnl-card";
import { cn } from "@/lib/utils";

const PANEL = "rounded-xl border border-white/[0.06] bg-white/[0.015]";
const cents = (p: number | null) => (p === null ? "—" : Math.round(p * 100) + "¢");
const usd = (v: number | null) => (v === null ? "—" : (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2));

/**
 * PositionsPnl — the wallet's real outcome-token holdings with avg-cost PnL, and
 * a Redeem action to collect winnings once a market resolves. Holdings, mark
 * price, and redemption are all on-chain; nothing is mocked.
 */
export function PositionsPnl({ onOpenMarket }: { onOpenMarket?: (symbol: string) => void } = {}) {
  const account = useActiveAccount();
  const inbox = useNotifications();
  const [positions, setPositions] = useState<Position[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [shareOf, setShareOf] = useState<Position | null>(null);

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
    // Redeem is signed in up to 2 steps (approve, then collect). Wallets often
    // can't show a gas estimate on the 2nd — set expectations up front.
    setNote("Redeeming takes up to 2 wallet signatures — approve both. Your wallet may not show a gas estimate on the 2nd; that's normal, confirm it anyway.");
    try {
      await redeemPosition(account, p.marketRef, p.shares);
      setNote("Redeemed — the USDC is back in your Trading balance.");
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

  // Close now = sell your shares back into the book at the bid (IOC), realizing
  // your P&L into USDC immediately — whether you're up or down.
  async function close(p: Position) {
    if (!account || p.bid === null) return;
    setClosing(p.symbol);
    setNote(null);
    try {
      await placeBrinkOrder({ account, symbol: p.symbol, side: "sell", quantity: p.shares, price: p.bid, timeInForce: "IOC" });
      setNote("Closed — the proceeds are back in your Trading balance.");
      inbox.push("Position closed", `Sold ${p.shares} ${p.outcome} @ ${Math.round(p.bid * 100)}¢ · ${tidy(p.marketRef)}`);
      await load();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Close failed — the book may be too thin to sell into right now.");
    } finally {
      setClosing(null);
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
        <div className="divide-y divide-white/[0.04]">
          {positions.map((p) => {
            const pnl = p.unrealizedPnl;
            const pct = p.costBasis && p.costBasis > 0 && pnl !== null ? (pnl / p.costBasis) * 100 : null;
            const pnlColor = pnl === null ? "text-muted-sage/60" : pnl >= 0 ? "text-highlighter-green" : "text-[#e08a8a]";
            return (
              <div key={p.symbol} className="p-3 sm:px-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenMarket?.(p.symbol)}
                    disabled={!onOpenMarket}
                    title={onOpenMarket ? "Open this market" : undefined}
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-md text-left",
                      onOpenMarket && "-mx-1 px-1 py-0.5 hover:bg-white/[0.04]"
                    )}
                  >
                    <OutcomeTag outcome={p.outcome} />
                    <span className="truncate text-[13px] font-medium text-bone-white">{tidy(p.marketRef)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareOf(p)}
                    className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.03] p-1.5 text-muted-sage/70 hover:text-bone-white"
                    aria-label="Share position"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                  <Cell label="Shares" value={String(p.shares)} />
                  <Cell label="Avg" value={cents(p.avgCost)} />
                  <Cell label="Mark" value={cents(p.markPrice)} />
                  <Cell label="Value" value={usd(p.value)} />
                </div>

                <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">Unrealized P&L</p>
                    <p className={cn("text-[15px] font-semibold tabular-nums", pnlColor)}>
                      {pnl === null ? "—" : `${usd(pnl)}${pct !== null ? ` (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)` : ""}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void close(p)}
                      disabled={closing === p.symbol || p.bid === null}
                      title={p.bid === null ? "No bid to sell into right now" : "Sell now and realize your P&L"}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-highlighter-green/25 bg-highlighter-green/[0.08] px-3 py-2 text-[12px] font-semibold text-highlighter-green hover:bg-highlighter-green/[0.14] disabled:opacity-40"
                    >
                      {closing === p.symbol ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => void redeem(p)}
                      disabled={redeeming === p.symbol}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-muted-sage/80 hover:text-bone-white disabled:opacity-50"
                    >
                      {redeeming === p.symbol ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Coins className="h-3.5 w-3.5" />}
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PnlCardModal position={shareOf} onClose={() => setShareOf(null)} />
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

function Cell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">{label}</p>
      <p className={cn("mt-0.5 truncate text-[13px] font-medium tabular-nums text-bone-white", className)}>{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-[13px] text-muted-sage/50">{text}</div>;
}

function tidy(symbol: string): string {
  return symbol.length > 30 ? symbol.slice(0, 28) + "…" : symbol;
}
