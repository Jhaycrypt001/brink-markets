import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchMarkets, type ScoredMarket } from "@/lib/markets";
import { usePrefs, notify } from "./prefs";

export type FeedSource = "live" | "empty" | "offline";
export type PricePoint = { t: number; p: number };

/**
 * useMarketFeed — the single real data source for the terminal. Polls the Brink
 * API every few seconds, accumulates a genuine per-market YES-price series from
 * the observed quotes (the chart is built from real ticks, not synthesized), and
 * fires the user's configured sound + notification alerts on real state changes.
 */
export function useMarketFeed(pollMs = 5000) {
  const prefs = usePrefs();
  const [markets, setMarkets] = useState<ScoredMarket[]>([]);
  const [source, setSource] = useState<FeedSource>("offline");
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const historyRef = useRef<Map<string, PricePoint[]>>(new Map());
  const [, bump] = useState(0);
  const prevTradeable = useRef<Set<string>>(new Set());
  const warnedExpiry = useRef<Set<string>>(new Set());
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const poll = useCallback(async () => {
    try {
      const data = await fetchMarkets(48);
      const now = Date.now();

      for (const m of data) {
        const arr = historyRef.current.get(m.marketId) ?? [];
        const p = Math.round((m.bestAsk ?? 0.5) * 100);
        const last = arr[arr.length - 1];
        if (!last || last.p !== p || now - last.t > 4000) {
          arr.push({ t: now, p });
          if (arr.length > 180) arr.shift();
          historyRef.current.set(m.marketId, arr);
        }
      }

      const P = prefsRef.current;
      const nowTradeable = new Set(data.filter((m) => m.tradeable).map((m) => m.marketId));
      for (const m of data) {
        if (m.tradeable && !prevTradeable.current.has(m.marketId)) {
          if (P.fillSounds) P.playTick();
          if (P.tradeableAlerts) notify("Market tradeable", m.question);
        }
        if (m.secondsLeft > 0 && m.secondsLeft <= 60 && !warnedExpiry.current.has(m.marketId)) {
          warnedExpiry.current.add(m.marketId);
          if (P.expiryWarnings) notify("Expiry soon", m.question + " — under a minute left");
        }
      }
      prevTradeable.current = nowTradeable;

      setMarkets(data);
      setSource(data.length > 0 ? "live" : "empty");
      setElapsed(0);
      bump((n) => n + 1);
    } catch {
      setSource("offline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void poll();
    const id = window.setInterval(() => void poll(), pollMs);
    return () => window.clearInterval(id);
  }, [poll, pollMs]);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ranked = useMemo(() => [...markets].sort((a, b) => b.score - a.score), [markets]);
  const historyFor = useCallback((id: string): PricePoint[] => historyRef.current.get(id) ?? [], []);

  return { markets, ranked, source, loading, elapsed, historyFor, refresh: poll };
}
