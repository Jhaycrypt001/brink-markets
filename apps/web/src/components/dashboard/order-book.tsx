import { useMemo } from "react";
import type { ScoredMarket } from "@/lib/markets";
import { formatCompact } from "@/lib/markets";

type Level = { price: number; size: number };

/**
 * OrderBook — the real bid/ask ladder from the API's order book (cents). Asks on
 * top down to the spread, bids below, with depth bars. Shows an empty state when
 * the market has no live book.
 */
export function OrderBook({ market }: { market: ScoredMarket }) {
  const { asks, bids } = useMemo(() => {
    const book = market.orderBook;
    if (!book) return { asks: [] as Level[], bids: [] as Level[] };
    const toLevels = (rows: Array<[number, number]>) =>
      rows.slice(0, 9).map(([price, size]) => ({ price: Math.round(price * 100), size }));
    return { asks: toLevels(book.asks).reverse(), bids: toLevels(book.bids) };
  }, [market]);

  const maxSize = useMemo(
    () => Math.max(1, ...asks.map((l) => l.size), ...bids.map((l) => l.size)),
    [asks, bids]
  );
  const spread = asks.length && bids.length ? asks[asks.length - 1].price - bids[0].price : 0;
  const hasBook = asks.length > 0 || bids.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="text-[12px] font-semibold text-bone-white">Order book</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-sage/50">Size · YES</span>
      </div>

      {!hasBook ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-muted-sage/50">
          No live book for this market.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto] px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-sage/40">
            <span>Price</span>
            <span>Size</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {asks.map((level, i) => (
              <BookRow key={"a" + i} level={level} maxSize={maxSize} side="ask" />
            ))}
            <div className="flex items-center justify-between border-y border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
              <span className="text-[13px] font-bold tabular-nums text-bone-white">
                {Math.round((market.bestAsk ?? 0.5) * 100)}¢
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-sage/50">Spread {spread}¢</span>
            </div>
            {bids.map((level, i) => (
              <BookRow key={"b" + i} level={level} maxSize={maxSize} side="bid" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BookRow({ level, maxSize, side }: { level: Level; maxSize: number; side: "ask" | "bid" }) {
  const pct = Math.min(100, (level.size / maxSize) * 100);
  const isBid = side === "bid";
  return (
    <div className="relative flex items-center justify-between px-3 py-[3px] text-[11px] tabular-nums">
      <span
        className={"absolute inset-y-0 right-0 " + (isBid ? "bg-highlighter-green/[0.10]" : "bg-newsprint-gray/[0.18]")}
        style={{ width: pct + "%" }}
        aria-hidden="true"
      />
      <span className={"relative " + (isBid ? "text-highlighter-green" : "text-[#e08a8a]")}>{level.price}¢</span>
      <span className="relative text-muted-sage/70">{formatCompact(level.size)}</span>
    </div>
  );
}
