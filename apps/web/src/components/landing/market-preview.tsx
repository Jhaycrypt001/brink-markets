import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchLiveMarkets, type ScoredMarket } from "@/lib/markets";
import { Reveal } from "@/components/ui/motion";
import { MarketCard } from "./market-card";

type FeedState = "loading" | "ready" | "empty" | "error";

export function MarketPreview() {
  const [markets, setMarkets] = useState<ScoredMarket[]>([]);
  const [state, setState] = useState<FeedState>("loading");

  async function loadMarkets() {
    setState("loading");
    try {
      const nextMarkets = await fetchLiveMarkets();
      setMarkets(nextMarkets);
      setState(nextMarkets.length === 0 ? "empty" : "ready");
    } catch {
      setMarkets([]);
      setState("error");
    }
  }

  useEffect(() => {
    void loadMarkets();
  }, []);

  return (
    <section id="markets" className="border-b border-press-black/15 py-20 lg:py-28">
      <div className="page-shell">
        <Reveal
          from="up"
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="eyebrow text-newsprint-gray">Live snapshot</p>
            <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.92] tracking-[-0.04em] text-press-black [text-wrap:balance]">
              The three markets worth a look right now.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void loadMarkets()}
            className="inline-flex w-fit items-center gap-2 rounded-pill border border-press-black px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.11px] text-press-black transition hover:bg-press-black hover:text-bone-white"
          >
            <RefreshCw
              className={"h-3.5 w-3.5 " + (state === "loading" ? "animate-spin" : "")}
              aria-hidden="true"
            />
            Refresh
          </button>
        </Reveal>
        <div className="mt-12 grid gap-px border border-press-black/15 bg-press-black/15 lg:grid-cols-3">
          {state === "loading" &&
            [0, 1, 2].map((card) => (
              <div key={card} className="min-h-[360px] animate-pulse bg-bone-white p-7">
                <div className="h-3 w-24 bg-echo-green" />
                <div className="mt-8 h-6 w-4/5 bg-echo-green" />
                <div className="mt-4 h-6 w-3/5 bg-echo-green" />
                <div className="mt-12 h-16 bg-echo-green" />
              </div>
            ))}

          {state === "ready" &&
            markets.map((market, index) => (
              <MarketCard key={market.marketId} market={market} index={index} />
            ))}

          {state !== "loading" && state !== "ready" && (
            <div className="bg-bone-white p-10 lg:col-span-3">
              <p className="eyebrow text-newsprint-gray">Feed status</p>
              <p className="mt-5 max-w-[620px] font-display text-[2.5rem] leading-[0.95] tracking-[-0.04em] text-press-black">
                {state === "empty"
                  ? "No market currently passes every gate."
                  : "The Shannon feed is not reachable from this browser."}
              </p>
              <p className="mt-4 max-w-[620px] text-body text-slate-verdant">
                {state === "empty"
                  ? "Brink keeps non-tradeable diagnostics out of this preview."
                  : "Start the API locally or set VITE_API_BASE_URL."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
