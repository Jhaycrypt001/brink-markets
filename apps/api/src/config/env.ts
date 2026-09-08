import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().positive().default(8787),
  MARKET_CACHE_TTL_MS: z.coerce.number().int().positive().default(3_000),
  MARKET_CACHE_STALE_MS: z.coerce.number().int().nonnegative().default(30_000),
  MARKET_MAX_RESULTS: z.coerce.number().int().positive().max(500).default(100),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  // Default to the public Somnia Shannon testnet endpoints so the API serves
  // real DreamDEX markets out of the box. Override for a private indexer/RPC.
  SOMNIA_INDEXER_URL: z.string().url().default("https://dev.smk.somnia.host/v1/graphql"),
  SOMNIA_WS_RPC_URL: z.string().url().default("wss://api.infra.testnet.somnia.network/ws")
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
