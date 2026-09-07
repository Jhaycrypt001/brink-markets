import { loadEnv } from "./config/env.js";
import { DreamDexMarketSource, EmptyMarketSource } from "./adapters/market-source.js";
import { buildApp } from "./http/app.js";
import { SOMNIA_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const env = loadEnv();
const source = env.SOMNIA_INDEXER_URL && env.SOMNIA_WS_RPC_URL
  ? new DreamDexMarketSource(new SomniaMarkets({
      indexerUrl: env.SOMNIA_INDEXER_URL,
      wsRpcUrl: env.SOMNIA_WS_RPC_URL,
      chain: somniaShannon,
      addresses: SOMNIA_TESTNET_ADDRESSES
    }))
  : new EmptyMarketSource();
const app = await buildApp(source, env.MARKET_CACHE_TTL_MS, env.CORS_ORIGIN, env.MARKET_CACHE_STALE_MS, env.MARKET_MAX_RESULTS);
await app.listen({ host: env.API_HOST, port: env.API_PORT });

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
