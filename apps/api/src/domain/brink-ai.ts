import type { ScoredMarket } from "./market.js";

/**
 * Brink AI — a real LLM assistant grounded in the live market snapshot.
 *
 * Provider-flexible and free-tier first:
 *   • GEMINI_API_KEY (or GOOGLE_API_KEY) → Google Gemini (free tier) — the default.
 *   • ANTHROPIC_API_KEY → Anthropic Claude — used only if no Gemini key is set.
 * The key lives only on the server; it is never shipped to the browser. The
 * model only sees the same real, scored DreamDEX markets the terminal reads and
 * is told to answer strictly from that snapshot, so it can't fabricate data.
 */

export class AiNotConfiguredError extends Error {
  public constructor() {
    super("No AI provider key set (GEMINI_API_KEY or ANTHROPIC_API_KEY)");
    this.name = "AiNotConfiguredError";
  }
}

export type AiTurn = { role: "user" | "assistant"; content: string };

type Provider = "gemini" | "anthropic" | null;

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
}

function activeProvider(): Provider {
  if (geminiKey()) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export function aiConfigured(): boolean {
  return activeProvider() !== null;
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
  const provider = activeProvider();
  if (!provider) throw new AiNotConfiguredError();

  const trimmed = history.slice(-6);
  const userTurn = `Live market snapshot (JSON):\n${snapshot(markets)}\n\nQuestion: ${question}`;

  const text =
    provider === "gemini"
      ? await askGemini(trimmed, userTurn)
      : await askAnthropic(trimmed, userTurn);

  return text.trim() || "I couldn't form an answer from the current market snapshot.";
}

/* ------------------------------- Gemini -------------------------------- */

async function askGemini(history: AiTurn[], userTurn: string): Promise<string> {
  const key = geminiKey();
  if (!key) throw new AiNotConfiguredError();
  const model = process.env.BRINK_AI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const contents = [
    // Gemini uses "user" / "model" role names.
    ...history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
    { role: "user", parts: [{ text: userTurn }] }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.4 }
    })
  });

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
    error?: { message?: string };
  };

  if (!response.ok) throw new Error(data.error?.message ?? `Gemini HTTP ${response.status}`);
  if (data.promptFeedback?.blockReason) return "I can't answer that one, but ask me about the live markets and I'll dig in.";

  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

/* ------------------------------ Anthropic ------------------------------ */

async function askAnthropic(history: AiTurn[], userTurn: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();
  const model = process.env.BRINK_AI_MODEL ?? "claude-opus-5";

  // Loaded lazily so the SDK is only required when Anthropic is actually used.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: userTurn }
  ];

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: SYSTEM,
    messages
  });

  return response.content.map((b) => ("text" in b ? b.text : "")).join("");
}
