import { useMemo } from "react";
import type { ScoredMarket } from "@/lib/markets";
import { genBook, type Level } from "./synth";
import { formatCompact } from "@/lib/markets";

/**
 * OrderBook — a compact bid/ask ladder in cents with depth bars. Asks on top
 * (descending to the spread), bids below. Uses live book data when present.
 */
export function OrderBook({ market }: { market: ScoredMarket }) {
  const book = useMemo(() => genBook(market), [market]);
  const maxSize = useMemo(
    () => Math.max(1, ...book.asks.map((l) => l.size), ...book.bids.map((l) => l.size)),
    [book]
  );
  const spread =
    book.asks.length && book.bids.length
      ? book.asks[book.asks.length - 1].price - book.bids[0].price
      : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="text-[12px] font-semibold text-bone-white">Order book</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-sage/50">Size · YES</span>
      </div>

      <div className="grid grid-cols-[1fr_auto] px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-sage/40">
        <span>Price</span>
        <span>Size</span>
      </div>

      <div className="flex-1 overflow-hidden">
        {book.asks.map((level, i) => (
          <BookRow key={"a" + i} level={level} maxSize={maxSize} side="ask" />
        ))}

        <div className="flex items-center justify-between border-y border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
          <span className="text-[13px] font-bold tabular-nums text-bone-white">
            {Math.round((market.bestAsk ?? 0.5) * 100)}¢
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-sage/50">
            Spread {spread}¢
          </span>
        </div>

        {book.bids.map((level, i) => (
          <BookRow key={"b" + i} level={level} maxSize={maxSize} side="bid" />
        ))}
      </div>
    </div>
  );
}

function BookRow({ level, maxSize, side }: { level: Level; maxSize: number; side: "ask" | "bid" }) {
  const pct = Math.min(100, (level.size / maxSize) * 100);
  const isBid = side === "bid";
  return (
    <div className="relative flex items-center justify-between px-3 py-[3px] text-[11px] tabular-nums">
      <span
        className={"absolute inset-y-0 " + (isBid ? "right-0 bg-highlighter-green/[0.10]" : "right-0 bg-newsprint-gray/[0.18]")}
        style={{ width: pct + "%" }}
        aria-hidden="true"
      />
      <span className={"relative " + (isBid ? "text-highlighter-green" : "text-[#e08a8a]")}>
        {level.price}¢
      </span>
      <span className="relative text-muted-sage/70">{formatCompact(level.size)}</span>
    </div>
  );
}
