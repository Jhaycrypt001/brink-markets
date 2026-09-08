import type { Account } from "thirdweb/wallets";
import { thirdwebClient, somniaShannon as somniaThirdwebChain } from "@/components/dashboard/wallet";

/**
 * placeBrinkOrder — sign and submit a real binary order on Somnia Shannon using
 * the connected wallet. The heavy markets SDK + viem adapter are dynamically
 * imported so they never touch the main bundle; the wallet signs every order
 * (Brink never holds a key). Returns the SDK's order result.
 */
export async function placeBrinkOrder(opts: {
  account: Account;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number; // YES price, 0..1
  timeInForce?: "IOC" | "GTC" | "FOK" | "PO";
}) {
  if (!thirdwebClient) throw new Error("Wallet is not configured (missing thirdweb client id).");

  const [{ SomniaMarkets, SOMNIA_TESTNET_ADDRESSES }, chains, viem] = await Promise.all([
    import("@somnia-chain/markets-sdk"),
    import("@somnia-chain/markets-sdk/chains"),
    import("thirdweb/adapters/viem")
  ]);

  const walletClient = await viem.viemAdapter.walletClient.toViem({
    client: thirdwebClient,
    chain: somniaThirdwebChain,
    account: opts.account
  });

  const exchange = new SomniaMarkets({
    indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
    wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
    chain: chains.somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    // The SDK accepts a browser wallet signer (see setSigner docs).
    walletClient: walletClient as unknown as Parameters<typeof SomniaMarkets.prototype.setSigner>[0]["walletClient"]
  });

  await exchange.loadMarkets(true);

  if (opts.quantity <= 0) throw new Error("Amount must be greater than zero.");
  if (opts.price <= 0 || opts.price >= 1) throw new Error("Price must be between 0 and 1.");

  // Unified createOrder(ref, type, side, amount, price, params) — plain numbers.
  return exchange.createOrder(opts.symbol, "limit", opts.side, opts.quantity, opts.price, {
    timeInForce: opts.timeInForce ?? "IOC"
  });
}
