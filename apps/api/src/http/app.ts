import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import type { LeaderEntry, MarketSource } from "../adapters/market-source.js";
import { scoreMarkets } from "../domain/scoring.js";
import type { BinaryMarket } from "../domain/market.js";
import { TtlCache } from "../lib/ttl-cache.js";
import { ReferralStore } from "../domain/referrals.js";
import { z } from "zod";

const marketQuerySchema = z.object({
  asset: z.string().trim().min(1).max(20).optional(),
  minScore: z.coerce.number().min(0).max(100).default(0),
  tradeableOnly: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(500).default(100)
});

const ohlcvQuerySchema = z.object({
  symbol: z.string().trim().min(1).max(120),
  tf: z.enum(["5m", "15m", "1h", "4h", "1d"]).default("1h"),
  limit: z.coerce.number().int().min(1).max(500).default(200)
});

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

const ethAddress = z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, "address");
const referralClaimSchema = z.object({
  address: ethAddress,
  code: z.string().trim().min(4).max(16)
});

export async function buildApp(source: MarketSource, cacheTtlMs: number, corsOrigin: string, staleCacheMs = 30_000, maxResults = 100): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const cache = new TtlCache<BinaryMarket[]>(cacheTtlMs, staleCacheMs);
  // The leaderboard fans out over many markets' fill tapes, so it caches longer
  // than the market list. Referral state lives in-process (see ReferralStore).
  const leaderboardCache = new TtlCache<LeaderEntry[]>(30_000, 120_000);
  const referrals = new ReferralStore();

  // CORS_ORIGIN may be a comma-separated list so both localhost and 127.0.0.1
  // (the two hosts Vite serves on) are accepted without extra config.
  const origins = corsOrigin.split(",").map((value) => value.trim()).filter(Boolean);
  await app.register(cors, { origin: origins.length > 1 ? origins : origins[0] ?? corsOrigin });

  app.get("/health", async (request, reply) => {
    reply.header("x-request-id", request.id);
    return { ok: true, service: "brink-api", requestId: request.id };
  });

  app.get<{ Querystring: { asset?: string; minScore?: string; tradeableOnly?: string; limit?: string } }>("/v1/markets", async (request, reply) => {
    reply.header("x-request-id", request.id);
    try {
      const query = marketQuerySchema.parse(request.query);
      const markets = await cache.getOrSet(() => source.listLiveBinaryMarkets());
      const scored = scoreMarkets(markets)
        .filter((market) => !query.asset || market.asset.toLowerCase() === query.asset.toLowerCase())
        .filter((market) => !query.tradeableOnly || market.tradeable)
        .filter((market) => market.score >= query.minScore)
        .slice(0, Math.min(query.limit, maxResults));
      return { data: scored, meta: { count: scored.length, generatedAt: new Date().toISOString(), requestId: request.id } };
    } catch (error) {
      if (error instanceof z.ZodError) return reply.code(400).send({ error: { code: "INVALID_QUERY", requestId: request.id } });
      request.log.error(error, "market discovery failed");
      return reply.code(502).send({ error: { code: "MARKET_SOURCE_UNAVAILABLE", requestId: request.id } });
    }
  });

  app.get<{ Querystring: { symbol?: string; tf?: string; limit?: string } }>("/v1/ohlcv", async (request, reply) => {
    reply.header("x-request-id", request.id);
    try {
      const query = ohlcvQuerySchema.parse(request.query);
      const candles = await source.fetchOHLCV(query.symbol, query.tf, query.limit);
      return { data: candles, meta: { symbol: query.symbol, tf: query.tf, count: candles.length, requestId: request.id } };
    } catch (error) {
      if (error instanceof z.ZodError) return reply.code(400).send({ error: { code: "INVALID_QUERY", requestId: request.id } });
      request.log.error(error, "ohlcv fetch failed");
      return reply.code(502).send({ error: { code: "MARKET_SOURCE_UNAVAILABLE", requestId: request.id } });
    }
  });

  app.get<{ Querystring: { limit?: string } }>("/v1/leaderboard", async (request, reply) => {
    reply.header("x-request-id", request.id);
    try {
      const query = leaderboardQuerySchema.parse(request.query);
      const board = await leaderboardCache.getOrSet(() => source.fetchLeaderboard(24, 100, 100));
      const data = board.slice(0, query.limit);
      return { data, meta: { count: data.length, generatedAt: new Date().toISOString(), requestId: request.id } };
    } catch (error) {
      if (error instanceof z.ZodError) return reply.code(400).send({ error: { code: "INVALID_QUERY", requestId: request.id } });
      request.log.error(error, "leaderboard build failed");
      return reply.code(502).send({ error: { code: "MARKET_SOURCE_UNAVAILABLE", requestId: request.id } });
    }
  });

  // Referrals — real per-wallet codes and attribution. GET returns a wallet's
  // own code + live stats; POST records that `address` was referred by `code`.
  app.get<{ Params: { address: string } }>("/v1/referrals/:address", async (request, reply) => {
    reply.header("x-request-id", request.id);
    const parsed = ethAddress.safeParse(request.params.address);
    if (!parsed.success) return reply.code(400).send({ error: { code: "INVALID_ADDRESS", requestId: request.id } });
    return { data: referrals.stats(parsed.data), meta: { requestId: request.id } };
  });

  app.post<{ Body: { address?: string; code?: string } }>("/v1/referrals/claim", async (request, reply) => {
    reply.header("x-request-id", request.id);
    try {
      const body = referralClaimSchema.parse(request.body);
      const result = referrals.claim(body.address, body.code);
      return { data: result, meta: { requestId: request.id } };
    } catch (error) {
      if (error instanceof z.ZodError) return reply.code(400).send({ error: { code: "INVALID_BODY", requestId: request.id } });
      request.log.error(error, "referral claim failed");
      return reply.code(500).send({ error: { code: "INTERNAL_ERROR", requestId: request.id } });
    }
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error, "unhandled request error");
    return reply.code(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500).send({
      error: { code: "INTERNAL_ERROR", requestId: request.id }
    });
  });

  app.addHook("onSend", async (request, reply) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header("cache-control", "no-store");
  });

  app.get<{ Params: { marketId: string } }>("/v1/markets/:marketId", async (request, reply) => {
    reply.header("x-request-id", request.id);
    try {
      const markets = await cache.getOrSet(() => source.listLiveBinaryMarkets());
      const market = scoreMarkets(markets).find((candidate) => candidate.marketId.toLowerCase() === request.params.marketId.toLowerCase());
      if (!market) return reply.code(404).send({ error: { code: "MARKET_NOT_FOUND", requestId: request.id } });
      return { data: market, meta: { generatedAt: new Date().toISOString(), requestId: request.id } };
    } catch (error) {
      request.log.error(error, "market detail failed");
      return reply.code(502).send({ error: { code: "MARKET_SOURCE_UNAVAILABLE", requestId: request.id } });
    }
  });

  return app;
}
