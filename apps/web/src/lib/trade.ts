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
