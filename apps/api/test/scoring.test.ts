import { describe, expect, it } from "vitest";
import { scoreMarket } from "../src/domain/scoring.js";

const now = 1_700_000_000_000;

function market(overrides: Record<string, unknown> = {}) {
  return {
    marketId: "0xabc",
    symbol: "BTC-YES",
    question: "Will BTC be up?",
    asset: "BTC",
    intervalSec: 900,
    expiry: now / 1000 + 900,
    status: "Trading" as const,
    volume: 100,
    tradeCount: 20,
    orderBook: { bids: [[0.49, 5] as [number, number]], asks: [[0.51, 5] as [number, number]], observedAt: now },
    ...overrides
  };
}

describe("scoreMarket", () => {
  it("marks a fresh, open, two-sided market tradeable", () => {
    const result = scoreMarket(market(), { now });
    expect(result.tradeable).toBe(true);
    expect(result.bestAsk).toBe(0.51);
    expect(result.score).toBeGreaterThan(70);
  });

  it("rejects locked markets even when the indexer row looks healthy", () => {
    const result = scoreMarket(market({ status: "Locked" }), { now });
    expect(result.tradeable).toBe(false);
    expect(result.reasons).toContain("Market is not trading on-chain");
  });

  it("rejects markets without expiry headroom", () => {
    const result = scoreMarket(market({ expiry: now / 1000 + 120 }), { now });
    expect(result.tradeable).toBe(false);
    expect(result.reasons).toContain("Too close to expiry");
  });

  it("rejects stale order books", () => {
    const result = scoreMarket(market({ orderBook: { bids: [[0.49, 5]], asks: [[0.51, 5]], observedAt: now - 20_000 } }), { now });
    expect(result.tradeable).toBe(false);
    expect(result.reasons).toContain("Order book is stale");
  });
});
