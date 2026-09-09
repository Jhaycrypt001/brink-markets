import Anthropic from "@anthropic-ai/sdk";
import type { ScoredMarket } from "./market.js";

/**
 * Brink AI — a real LLM assistant grounded in the live market snapshot.
 *
 * The model only ever sees the same real, scored DreamDEX markets the terminal
 * reads, and is instructed to answer strictly from that snapshot (or say it
 * doesn't have the data) so it can't fabricate prices or markets. The API key
 * lives only on the server — it is never shipped to the browser.
 */

export class AiNotConfiguredError extends Error {
  public constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "AiNotConfiguredError";
  }
}

export type AiTurn = { role: "user" | "assistant"; content: string };

const MODEL = process.env.BRINK_AI_MODEL ?? "claude-opus-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Compact each market to the few fields the model needs — cheap on tokens. */
function snapshot(markets: ScoredMarket[]): string {
  if (markets.length === 0) return "No live markets on the feed right now.";
  const rows = markets.slice(0, 24).map((m) => ({
    asset: m.asset,
    question: m.question,
    score: Number(m.score.toFixed(1)),
    yesAskCents: m.bestAsk === undefined ? null : Math.round(m.bestAsk * 100),
    bidCents: m.bestBid === undefined ? null : Math.round(m.bestBid * 100),
    spreadPts: m.spread === undefined ? null : Math.round(m.spread * 100),
    secondsLeft: Math.max(0, Math.round(m.secondsLeft)),
    volumeUsd: Math.round(m.volume),
    tradeable: m.tradeable,
    status: m.status
  }));
  return JSON.stringify(rows);
}

const SYSTEM = [
  "You are Brink AI, the market-discovery assistant inside the Brink Markets terminal.",
  "Brink surfaces short-interval binary event contracts trading on DreamDEX on the Somnia network.",
  "Prices are the YES outcome's implied probability, quoted in cents (0–100¢). 'Score' is Brink's 0–100 tradeability score.",
  "You are given a JSON snapshot of the CURRENT live markets. Answer ONLY from that snapshot.",
  "If the snapshot doesn't contain what's asked, say so plainly — never invent markets, prices, or numbers.",
  "Be concise and concrete: name the asset and question, cite the real cents/score/time-left figures.",
  "Plain text only — no markdown headings or tables. A few tight sentences, or a short list at most."
].join(" ");

export async function askBrinkAI(
  question: string,
  markets: ScoredMarket[],
  history: AiTurn[] = []
): Promise<string> {
  const anthropic = getClient();

  // Keep only the last few turns for context; prepend the live snapshot to the
  // current question so the model always answers against fresh data.
  const trimmed = history.slice(-6);
  const messages: Anthropic.MessageParam[] = [
    ...trimmed.map((t) => ({ role: t.role, content: t.content })),
    {
      role: "user" as const,
      content: `Live market snapshot (JSON):\n${snapshot(markets)}\n\nQuestion: ${question}`
    }
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: SYSTEM,
    messages
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return text || "I couldn't form an answer from the current market snapshot.";
}
