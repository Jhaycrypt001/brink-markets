import { useEffect, useState, type ReactNode } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import type { ScoredMarket } from "@/lib/markets";
import { placeBrinkOrder } from "@/lib/trade";
import { useNotifications } from "@/components/dashboard/notifications";
import { cn } from "@/lib/utils";

type Side = "buy" | "sell";
type Status = { kind: "idle" | "signing" | "ok" | "error"; message?: string };

/**
 * TradeTicket — a real order ticket. Buy YES or Sell at a limit price against the
 * live book; on submit the connected wallet signs an IOC order on Somnia via the
 * markets SDK. Nothing is mocked: cost, balance gate, and submission are real.
 */
export function TradeTicket({ market }: { market: ScoredMarket }) {
  const account = useActiveAccount();
  const inbox = useNotifications();
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("10");
  const [priceCents, setPriceCents] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Default the limit to the touch: best ask for buys, best bid for sells.
  useEffect(() => {
    const touch = side === "buy" ? market.bestAsk : market.bestBid;
    setPriceCents(touch ? String(Math.round(touch * 100)) : "");
    setStatus({ kind: "idle" });
  }, [market.marketId, side, market.bestAsk, market.bestBid]);

  const qty = Number(amount);
  const cents = Number(priceCents);
  const validQty = Number.isFinite(qty) && qty > 0;
  const validPrice = Number.isFinite(cents) && cents > 0 && cents < 100;
  const cost = validQty && validPrice ? (qty * cents) / 100 : 0;
  const canSubmit = validQty && validPrice && !!account && status.kind !== "signing" && market.tradeable;

  const notTradeable = !market.tradeable;
  // Surface the actual blocking reason from scoring instead of a generic line.
  const blockReason = market.reasons.find((r) => r !== "Ready to trade") ?? "It isn't trading on-chain right now.";

  async function submit() {
    if (!account || !canSubmit) return;
    setStatus({ kind: "signing" });
    try {
      await placeBrinkOrder({
        account,
        symbol: market.symbol,
        side,
        quantity: qty,
        price: cents / 100,
        timeInForce: "IOC"
      });
      setStatus({ kind: "ok", message: `${side === "buy" ? "Bought" : "Sold"} ${qty} @ ${cents}¢ (IOC)` });
      inbox.push("Order submitted", `${side === "buy" ? "Buy" : "Sell"} ${qty} · ${market.question}`);
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Order failed. Check funds and try again." });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-white/[0.06] p-1">
        <SideButton active={side === "buy"} tone="buy" onClick={() => setSide("buy")}>Buy YES</SideButton>
        <SideButton active={side === "sell"} tone="sell" onClick={() => setSide("sell")}>Sell</SideButton>
      </div>

      <div className="flex-1 space-y-3 p-3">
        <Field label="Amount (shares)">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-right text-[15px] font-semibold tabular-nums text-bone-white focus:outline-none"
          />
        </Field>
        <Field label="Limit price">
          <div className="flex items-center gap-1">
            <input
              inputMode="decimal"
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              className="w-full bg-transparent text-right text-[15px] font-semibold tabular-nums text-bone-white focus:outline-none"
            />
            <span className="text-[13px] text-muted-sage/50">¢</span>
          </div>
        </Field>

        <div className="flex items-center justify-between px-1 text-[12px]">
          <span className="text-muted-sage/55">Est. cost</span>
          <span className="font-semibold tabular-nums text-bone-white">{cost > 0 ? `$${cost.toFixed(2)}` : "—"}</span>
        </div>

        {notTradeable && (
          <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] text-muted-sage/60">
            Can't trade this one right now — {blockReason.toLowerCase()}.
          </p>
        )}

        {status.kind === "ok" && (
          <p className="flex items-center gap-2 rounded-lg bg-highlighter-green/[0.1] px-3 py-2 text-[12px] text-highlighter-green">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {status.message}
          </p>
        )}
        {status.kind === "error" && (
          <p className="flex items-start gap-2 rounded-lg bg-[#e08a8a]/[0.1] px-3 py-2 text-[12px] text-[#e08a8a]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span className="break-words">{status.message}</span>
          </p>
        )}
      </div>

      <div className="p-3 pt-0">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[12px] font-bold uppercase tracking-wider transition disabled:opacity-40",
            side === "buy" ? "bg-highlighter-green text-press-black hover:brightness-105" : "bg-[#e08a8a] text-press-black hover:brightness-105"
          )}
        >
          {status.kind === "signing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing…
            </>
          ) : (
            <>{side === "buy" ? "Buy YES" : "Sell"} · IOC</>
          )}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-sage/40">Immediate-or-cancel · signed in your wallet</p>
      </div>
    </div>
  );
}

function SideButton({ active, tone, onClick, children }: { active: boolean; tone: Side; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md py-2 text-[12px] font-bold uppercase tracking-wider transition-colors",
        active
          ? tone === "buy"
            ? "bg-highlighter-green/[0.14] text-highlighter-green"
            : "bg-[#e08a8a]/[0.14] text-[#e08a8a]"
          : "text-muted-sage/60 hover:text-bone-white"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-sage/45">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}
