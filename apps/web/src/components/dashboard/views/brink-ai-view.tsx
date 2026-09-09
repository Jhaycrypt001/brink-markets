import { useState, useRef, useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import type { ScoredMarket, AiTurn } from "@/lib/markets";
import { formatDuration, askBrinkAI, fetchAiConfigured } from "@/lib/markets";
import { PromptBox } from "@/components/ui/prompt-box";
import { MessageLoading } from "@/components/ui/message-loading";
import { PANEL } from "./_shared";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Which markets clear every gate right now?",
  "Explain the top market's score",
  "Anything expiring in under 10 minutes?",
  "Which markets have the tightest spread?"
];

const SEED: Msg[] = [
  { role: "ai", text: "I'm Brink AI. Ask me to surface markets, explain a score, or spot a setup — I answer from the live feed the terminal reads." }
];

/**
 * Offline fallback: rule-based answers computed over the REAL live feed. Used
 * only when the AI backend has no key configured or is unreachable, so the
 * assistant is never dead — but the primary path is the real LLM.
 */
function answer(prompt: string, markets: ScoredMarket[]): string {
  if (markets.length === 0)
    return "There are no live markets on the feed right now, so there's nothing to rank. New DreamDEX markets show up here the moment they go live.";

  const ranked = [...markets].sort((a, b) => b.score - a.score);
  const cents = (v?: number) => (v === undefined ? "—" : Math.round(v * 100) + "¢");
  const p = prompt.toLowerCase();

  if (p.includes("gate") || p.includes("tradeable")) {
    const t = ranked.filter((m) => m.tradeable);
    if (t.length === 0) return "Nothing clears every gate right now — no market is Trading on-chain with a fresh two-sided book.";
    return `${t.length} market${t.length === 1 ? "" : "s"} clear every gate: ` + t.slice(0, 5).map((m) => `${m.asset} “${m.question}” (${m.score.toFixed(1)})`).join("; ") + ".";
  }
  if (p.includes("score") || p.includes("explain")) {
    const m = ranked[0];
    return `Top market: ${m.asset} “${m.question}” at ${m.score.toFixed(1)}. Ask ${cents(m.bestAsk)}, spread ${m.spread === undefined ? "—" : Math.round(m.spread * 100) + " pts"}, ${formatDuration(Math.max(0, m.secondsLeft))} to expiry. Reasons: ${m.reasons.join("; ") || "—"}.`;
  }
  if (p.includes("expir")) {
    const soon = ranked.filter((m) => m.secondsLeft > 0 && m.secondsLeft <= 600).sort((a, b) => a.secondsLeft - b.secondsLeft);
    if (soon.length === 0) return "Nothing expires within 10 minutes on the current feed.";
    return "Expiring under 10 minutes: " + soon.map((m) => `${m.asset} (${formatDuration(m.secondsLeft)}, ${m.score.toFixed(1)})`).join("; ") + ".";
  }
  if (p.includes("spread") || p.includes("tight")) {
    const withSpread = ranked.filter((m) => m.spread !== undefined).sort((a, b) => (a.spread! - b.spread!));
    if (withSpread.length === 0) return "No market currently has a two-sided quote to measure a spread.";
    return "Tightest spreads: " + withSpread.slice(0, 4).map((m) => `${m.asset} ${Math.round(m.spread! * 100)} pts (${cents(m.bestAsk)})`).join("; ") + ".";
  }
  return `I'm tracking ${markets.length} live market${markets.length === 1 ? "" : "s"}. Top-ranked: ${ranked[0].asset} “${ranked[0].question}” at ${ranked[0].score.toFixed(1)}. Ask about gates, scores, expiry, or spreads.`;
}

export function BrinkAiView({ markets }: { markets: ScoredMarket[] }) {
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  // null = unknown yet, true = real LLM wired, false = offline heuristic mode.
  const [aiLive, setAiLive] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    void fetchAiConfigured().then((ok) => alive && setAiLive(ok));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    const history: AiTurn[] = messages
      .filter((m) => m.text)
      .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    try {
      const reply = await askBrinkAI(q, history);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
      setAiLive(true);
    } catch (err) {
      // No key or backend unreachable → fall back to the local heuristic.
      if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") setAiLive(false);
      setMessages((m) => [...m, { role: "ai", text: answer(q, markets) }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] min-h-[440px] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlighter-green/12 text-highlighter-green">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-[1.6rem] leading-none tracking-[-0.03em]">Brink AI</h1>
          <p className="text-[12px] text-muted-sage/55">
            {aiLive === false
              ? "Offline heuristic — add a free Gemini key to enable the LLM"
              : "Natural-language market discovery, grounded in the live feed"}
          </p>
        </div>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider",
            aiLive === false ? "bg-white/[0.06] text-muted-sage/70" : "bg-highlighter-green/12 text-highlighter-green"
          )}
        >
          {aiLive === false ? "Heuristic" : aiLive ? "AI · Live" : "Live"}
        </span>
      </div>

      <div className={cn(PANEL, "no-scrollbar flex-1 space-y-4 overflow-y-auto p-4")}>
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "bg-highlighter-green text-press-black"
                  : "border border-white/[0.06] bg-white/[0.03] text-bone-white"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <MessageLoading className="text-highlighter-green/80" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-muted-sage/80 transition hover:border-white/[0.16] hover:text-bone-white"
            >
              <Sparkles className="h-3 w-3 text-highlighter-green" /> {s}
            </button>
          ))}
        </div>
      )}

      <PromptBox
        value={input}
        onChange={setInput}
        onSubmit={() => void send(input)}
        disabled={thinking}
        busy={thinking}
        className="mt-3"
      />
    </div>
  );
}
