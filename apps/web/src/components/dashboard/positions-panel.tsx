import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RefreshCw, X, AlertTriangle, Loader2, ArrowUpRight } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { fetchOpenOrders, fetchMyFills, cancelBrinkOrder, type OpenOrder, type Fill } from "@/lib/trade";
import { useNotifications } from "@/components/dashboard/notifications";
import { cn } from "@/lib/utils";

type Tab = "orders" | "fills";

/**
 * PositionsPanel — the connected wallet's real open orders and recent fills,
 * read from the markets SDK. Open orders can be cancelled (signed by the wallet).
 * Nothing is mocked; an empty board means the account simply has none.
 */
export function PositionsPanel({ onOpenMarket }: { onOpenMarket?: (symbol: string) => void } = {}) {
  const account = useActiveAccount();
  const inbox = useNotifications();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const [o, f] = await Promise.all([fetchOpenOrders(account), fetchMyFills(account)]);
      setOrders(o);
      setFills(f);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  async function cancel(order: OpenOrder) {
    if (!account) return;
    setCancelling(order.id);
    try {
      await cancelBrinkOrder(account, order.id, order.symbol);
      inbox.push("Order cancelled", tidy(order.symbol));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <div className="flex items-center gap-1">
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>
            Open orders <Count n={orders.length} />
          </TabBtn>
          <TabBtn active={tab === "fills"} onClick={() => setTab("fills")}>
            Fills <Count n={fills.length} />
          </TabBtn>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md p-1.5 text-muted-sage/50 hover:bg-white/[0.05] hover:text-bone-white"
          aria-label="Refresh"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-2 border-b border-white/[0.06] px-3 py-2 text-[12px] text-[#e08a8a]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="break-words">{error}</span>
        </p>
      )}

      {tab === "orders" ? (
        orders.length === 0 ? (
          <Empty text={loading ? "Loading your orders…" : "No open orders. Placed orders that rest appear here."} />
        ) : (
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-sage/40">
                  <Th className="pl-4">Market</Th>
                  <Th>Side</Th>
                  <Th>Price</Th>
                  <Th>Size</Th>
                  <Th>Filled</Th>
                  <Th className="pr-4 text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-white/[0.04]">
                    <td className="py-2.5 pl-4 text-bone-white">{tidy(o.symbol)}</td>
                    <td><SideTag side={o.side} /></td>
                    <td className="tabular-nums text-bone-white">{o.price === undefined ? "—" : Math.round(o.price * 100) + "¢"}</td>
                    <td className="tabular-nums text-muted-sage/80">{o.amount}</td>
                    <td className="tabular-nums text-muted-sage/80">{o.filled}/{o.amount}</td>
                    <td className="py-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => void cancel(o)}
                        disabled={cancelling === o.id}
                        className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-muted-sage/80 hover:text-bone-white disabled:opacity-50"
                      >
                        {cancelling === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : fills.length === 0 ? (
        <Empty text={loading ? "Loading fills…" : "No fills yet. Executed trades appear here."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-sage/40">
                <Th className="pl-4">Market</Th>
                <Th>Side</Th>
                <Th>Price</Th>
                <Th>Size</Th>
                <Th className="pr-4 text-right">When</Th>
              </tr>
            </thead>
            <tbody>
              {fills.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onOpenMarket?.(t.symbol)}
                  title={onOpenMarket ? "Open this market" : undefined}
                  className={cn(
                    "border-t border-white/[0.04]",
                    onOpenMarket && "cursor-pointer transition-colors hover:bg-white/[0.03]"
                  )}
                >
                  <td className="py-2.5 pl-4 text-bone-white">
                    <span className="inline-flex items-center gap-1.5">
                      {tidy(t.symbol)}
                      {onOpenMarket && <ArrowUpRight className="h-3 w-3 text-muted-sage/40" />}
                    </span>
                  </td>
                  <td><SideTag side={t.side} /></td>
                  <td className="tabular-nums text-bone-white">{Math.round(t.price * 100)}¢</td>
                  <td className="tabular-nums text-muted-sage/80">{t.amount}</td>
                  <td className="py-2.5 pr-4 text-right text-muted-sage/60">{t.timestamp ? timeAgo(t.timestamp) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * useOpenOrders — one shared poll of the wallet's resting orders (8s), with a
 * wallet-signed cancel. The Trade view mounts it once and feeds both the strip
 * and the order-book markers, so the ladder and the strip never disagree.
 */
export function useOpenOrders(account: ReturnType<typeof useActiveAccount>) {
  const inbox = useNotifications();
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!account) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setOrders(await fetchOpenOrders(account));
    } catch {
      /* keep last known; the Wallet panel surfaces errors */
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  const cancel = useCallback(
    async (o: OpenOrder) => {
      if (!account) return;
      setCancelling(o.id);
      try {
        await cancelBrinkOrder(account, o.id, o.symbol);
        inbox.push("Order cancelled", tidy(o.symbol));
        await load();
      } catch {
        /* surfaced on the Wallet panel */
      } finally {
        setCancelling(null);
      }
    },
    [account, inbox, load]
  );

  return { orders, loading, refresh: load, cancel, cancelling };
}

type OpenOrdersControls = ReturnType<typeof useOpenOrders>;

/**
 * OpenOrdersStrip — a compact, in-context row of resting orders for the Trade
 * view. Presentational: it's driven by a shared useOpenOrders() instance.
 */
export function OpenOrdersStrip({ orders, loading, refresh, cancel, cancelling }: OpenOrdersControls) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="text-[12px] font-semibold text-bone-white">
          Open orders <span className="ml-1 text-[10px] text-muted-sage/40">{orders.length}</span>
        </span>
        <button type="button" onClick={() => void refresh()} className="rounded-md p-1.5 text-muted-sage/50 hover:bg-white/[0.05] hover:text-bone-white" aria-label="Refresh">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="px-3 py-3 text-[12px] text-muted-sage/50">{loading ? "Loading…" : "No open orders."}</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto p-2.5">
          {orders.map((o) => (
            <div key={o.id} className="flex shrink-0 items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
              <SideTag side={o.side} />
              <span className="text-[12px] text-bone-white">{tidy(o.symbol)}</span>
              <span className="text-[12px] tabular-nums text-muted-sage/70">
                {o.price === undefined ? "—" : Math.round(o.price * 100) + "¢"} · {o.filled}/{o.amount}
              </span>
              <button
                type="button"
                onClick={() => void cancel(o)}
                disabled={cancelling === o.id}
                className="rounded-md p-1 text-muted-sage/50 hover:bg-white/[0.06] hover:text-[#e08a8a] disabled:opacity-50"
                aria-label="Cancel order"
              >
                {cancelling === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors",
        active ? "bg-white/[0.06] text-bone-white" : "text-muted-sage/60 hover:text-bone-white"
      )}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1 text-[10px] text-muted-sage/40">{n}</span>;
}

function SideTag({ side }: { side: "buy" | "sell" }) {
  return (
    <span className={cn("text-[12px] font-semibold", side === "buy" ? "text-highlighter-green" : "text-[#e08a8a]")}>
      {side === "buy" ? "Buy" : "Sell"}
    </span>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-2 py-2 font-semibold first:pl-4", className)}>{children}</th>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-[13px] text-muted-sage/50">{text}</div>;
}

function tidy(symbol: string): string {
  return symbol.length > 28 ? symbol.slice(0, 26) + "…" : symbol;
}

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
