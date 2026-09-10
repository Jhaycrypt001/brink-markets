import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { activeProvider } from "./domain/brink-ai.js";
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
// Hosts like Railway/Render inject PORT and expect the app on 0.0.0.0. Locally,
// fall back to the configured host/port (127.0.0.1:8787).
const port = process.env.PORT ? Number(process.env.PORT) : env.API_PORT;
const host = process.env.PORT ? "0.0.0.0" : env.API_HOST;
await app.listen({ host, port });

// Say plainly, at startup, whether Brink AI has a key — so a missing/misplaced
// GEMINI_API_KEY is obvious in the terminal instead of a silent "HEURISTIC".
const provider = activeProvider();
app.log.info(
  provider
    ? `Brink AI: LLM enabled via ${provider}` + (process.env.BRINK_AI_MODEL ? ` (model ${process.env.BRINK_AI_MODEL})` : "")
    : "Brink AI: NO key found — running heuristic. Set GEMINI_API_KEY in the repo-root .env and restart."
);

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
