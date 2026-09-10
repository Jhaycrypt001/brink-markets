import type { Account } from "thirdweb/wallets";
import { thirdwebClient, somniaShannon as somniaThirdwebChain } from "@/components/dashboard/wallet";

/**
 * Trading + account reads against Somnia Shannon using the connected wallet.
 * The heavy markets SDK + viem adapter are dynamically imported so they never
 * touch the main bundle. A single exchange instance (with markets loaded) is
 * cached per connected address and reused for orders, open-order reads, fills,
 * and cancels. The wallet signs every write; Brink never holds a key.
 */

const INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";
const WS_RPC_URL = "wss://api.infra.testnet.somnia.network/ws";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Exchange = any;
let cache: { address: string; exchange: Promise<Exchange> } | null = null;

async function buildExchange(account: Account): Promise<Exchange> {
  if (!thirdwebClient) throw new Error("Wallet is not configured (missing thirdweb client id).");

  const [{ SomniaMarkets, SOMNIA_TESTNET_ADDRESSES }, chains, viem] = await Promise.all([
    import("@somnia-chain/markets-sdk"),
    import("@somnia-chain/markets-sdk/chains"),
    import("thirdweb/adapters/viem")
  ]);

  const walletClient = await viem.viemAdapter.walletClient.toViem({
    client: thirdwebClient,
    chain: somniaThirdwebChain,
    account
  });

  const exchange = new SomniaMarkets({
    indexerUrl: INDEXER_URL,
    wsRpcUrl: WS_RPC_URL,
    chain: chains.somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletClient: walletClient as any
  });
  await exchange.loadMarkets(true);
  return exchange;
}

/** Shared exchange for the connected account (built + markets loaded once). */
export function getExchange(account: Account): Promise<Exchange> {
  if (!cache || cache.address !== account.address) {
    cache = { address: account.address, exchange: buildExchange(account) };
  }
  return cache.exchange;
}

export type OpenOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  price?: number;
  amount: number;
  filled: number;
  remaining: number;
};

export type Fill = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  timestamp?: number;
};

export async function placeBrinkOrder(opts: {
  account: Account;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  timeInForce?: "IOC" | "GTC" | "FOK" | "PO";
}) {
  if (opts.quantity <= 0) throw new Error("Amount must be greater than zero.");
  if (opts.price <= 0 || opts.price >= 1) throw new Error("Price must be between 0 and 1.");
  const exchange = await getExchange(opts.account);
  return exchange.createOrder(opts.symbol, "limit", opts.side, opts.quantity, opts.price, {
    timeInForce: opts.timeInForce ?? "IOC"
  });
}

export async function fetchOpenOrders(account: Account): Promise<OpenOrder[]> {
  const exchange = await getExchange(account);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await exchange.fetchOpenOrders();
  return rows.map((o) => ({
    id: String(o.id),
    symbol: String(o.symbol),
    side: o.side === "sell" ? "sell" : "buy",
    price: typeof o.price === "number" ? o.price : undefined,
    amount: Number(o.amount ?? 0),
    filled: Number(o.filled ?? 0),
    remaining: Number(o.remaining ?? Math.max(0, Number(o.amount ?? 0) - Number(o.filled ?? 0)))
  }));
}

export async function fetchMyFills(account: Account): Promise<Fill[]> {
  const exchange = await getExchange(account);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await exchange.fetchMyTrades(undefined, undefined, 30);
  return rows.map((t, i) => ({
    id: String(t.id ?? t.txHash ?? i),
    symbol: String(t.symbol),
    side: t.side === "sell" ? "sell" : "buy",
    price: Number(t.price ?? 0),
    amount: Number(t.amount ?? 0),
    timestamp: typeof t.timestamp === "number" ? t.timestamp : undefined
  }));
}

export async function cancelBrinkOrder(account: Account, id: string, symbol: string) {
  const exchange = await getExchange(account);
  return exchange.cancelOrder(id, symbol);
}

/* ----------------------------- Positions + PnL ---------------------------- */

export type Position = {
  /** Outcome-token symbol, e.g. "BTC-…/USDC#YES". */
  symbol: string;
  /** Market ref without the outcome suffix, used for redeem. */
  marketRef: string;
  outcome: "YES" | "NO";
  /** Shares held. */
  shares: number;
  /** Avg entry price (0..1), from this wallet's buy fills. null if unknown. */
  avgCost: number | null;
  /** Fair mark = mid of bid/ask (0..1). Used for value + unrealized PnL. */
  markPrice: number | null;
  /** Best bid (0..1) — the price you'd actually sell into to Close now. */
  bid: number | null;
  /** shares × avgCost (what you paid), in USDC. */
  costBasis: number | null;
  /** shares × markPrice (what it's worth now), in USDC. null if unmarked. */
  value: number | null;
  /** value − costBasis, in USDC. null if unmarked. */
  unrealizedPnl: number | null;
};

/**
 * Real open positions with avg-cost PnL. Holdings come from fetchBalance()
 * (on-chain outcome-token balances); average entry is folded from this wallet's
 * own buy fills; the mark is the current best bid (what you could sell for now).
 * Everything is live chain/indexer data — nothing is mocked.
 */
export async function fetchPositions(account: Account): Promise<Position[]> {
  const exchange = await getExchange(account);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [balances, fills] = await Promise.all([
    exchange.fetchBalance() as Promise<Record<string, { total?: number }>>,
    exchange.fetchMyTrades(undefined, undefined, 200) as Promise<
      Array<{ symbol?: string; side?: string; price?: number; amount?: number }>
    >
  ]);

  // Weighted-average entry from buy fills, per outcome symbol.
  const buyAgg = new Map<string, { cost: number; qty: number }>();
  for (const f of fills) {
    if (f.side !== "buy" || !f.symbol) continue;
    const price = Number(f.price ?? 0);
    const amount = Number(f.amount ?? 0);
    if (amount <= 0) continue;
    const a = buyAgg.get(f.symbol) ?? { cost: 0, qty: 0 };
    a.cost += price * amount;
    a.qty += amount;
    buyAgg.set(f.symbol, a);
  }

  const held = Object.entries(balances)
    .filter(([code, b]) => code.includes("#") && Number(b.total ?? 0) > 0)
    .map(([symbol, b]) => ({ symbol, shares: Number(b.total ?? 0) }));

  const positions = await Promise.all(
    held.map(async ({ symbol, shares }): Promise<Position> => {
      const [marketRef, outcomeRaw] = symbol.split("#");
      const outcome: "YES" | "NO" = outcomeRaw === "NO" ? "NO" : "YES";
      const agg = buyAgg.get(symbol);
      const avgCost = agg && agg.qty > 0 ? agg.cost / agg.qty : null;

      let bid: number | null = null;
      let markPrice: number | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const book: any = await exchange.fetchOrderBook(symbol, 1);
        const bestBid = book?.bids?.[0]?.[0];
        const bestAsk = book?.asks?.[0]?.[0];
        bid = typeof bestBid === "number" ? bestBid : null;
        const ask = typeof bestAsk === "number" ? bestAsk : null;
        // Mark to the mid so a fresh position isn't shown down by the spread.
        markPrice = bid !== null && ask !== null ? (bid + ask) / 2 : (bid ?? ask);
      } catch {
        markPrice = null;
      }

      const costBasis = avgCost !== null ? shares * avgCost : null;
      const value = markPrice !== null ? shares * markPrice : null;
      const unrealizedPnl = value !== null && costBasis !== null ? value - costBasis : null;

      return { symbol, marketRef, outcome, shares, avgCost, markPrice, bid, costBasis, value, unrealizedPnl };
    })
  );

  return positions.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
}

/** Redeem a resolved market's winning shares for USDC collateral. */
export async function redeemPosition(account: Account, marketRef: string, shares: number) {
  const exchange = await getExchange(account);
  return exchange.redeem(marketRef, shares);
}

/**
 * The wallet's live trading balance — the venue's collateral token (testnet
 * USDC). This is the balance that goes down when you buy and up when you sell or
 * redeem a winner. Read straight from the SDK's on-chain balance map.
 */
export async function fetchTradingBalance(account: Account): Promise<number | null> {
  const exchange = await getExchange(account);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bal: Record<string, { total?: number }> = await exchange.fetchBalance();
  const usdc = bal["USDC"]?.total;
  if (typeof usdc === "number") return usdc;
  // Fallback: the largest non-outcome (no "#") balance is the collateral.
  const best = Object.entries(bal)
    .filter(([code]) => !code.includes("#"))
    .map(([, v]) => Number(v?.total ?? 0))
    .sort((a, b) => b - a)[0];
  return Number.isFinite(best) ? best : null;
}
