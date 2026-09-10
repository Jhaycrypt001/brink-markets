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
// Hosts like Railway/Render must reach the app on 0.0.0.0 — binding 127.0.0.1
// there makes the container unreachable ("Application failed to respond").
// Treat it as a deployed context if PORT is injected, NODE_ENV=production, or
// any Railway/Render marker is present, and bind 0.0.0.0 then. Only true local
// dev (none of those) keeps 127.0.0.1. PORT wins for the port when set.
const deployed = Boolean(
  process.env.PORT ||
    process.env.NODE_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER
);
const port = process.env.PORT ? Number(process.env.PORT) : env.API_PORT;
const host = deployed ? "0.0.0.0" : env.API_HOST;
await app.listen({ host, port });
app.log.info(`brink-api listening on ${host}:${port} (deployed=${deployed}, PORT=${process.env.PORT ?? "unset"})`);

// Say plainly, at startup, whether Brink AI has a key — so a missing/misplaced
// GEMINI_API_KEY is obvious in the terminal instead of a silent "HEURISTIC".
const provider = activeProvider();
app.log.info(
  provider
    ? `Brink AI: LLM enabled via ${provider}` + (process.env.BRINK_AI_MODEL ? ` (model ${process.env.BRINK_AI_MODEL})` : "")
    : "Brink AI: NO key found — running heuristic. Set GEMINI_API_KEY in the repo-root .env and restart."
);

// Keep the HTTP server alive if a *background* dependency misbehaves — e.g. the
// Somnia SDK's WebSocket erroring out in a network-restricted host. Without
// these, one unhandled socket error would take down the whole process and the
// platform would report "Application failed to respond". We log and stay up;
// affected routes degrade (empty market source) instead of crashing /health.
process.on("unhandledRejection", (reason) => {
  app.log.error({ reason }, "unhandledRejection — kept alive");
});
process.on("uncaughtException", (err) => {
  app.log.error({ err }, "uncaughtException — kept alive");
});

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
