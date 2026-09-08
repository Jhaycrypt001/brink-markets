import { useState, useRef, useEffect } from "react";
import { Bot, ArrowUp, Sparkles } from "lucide-react";
import type { ScoredMarket } from "@/lib/markets";
import { formatDuration } from "@/lib/markets";
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

/** Rule-based answers computed over the REAL live feed (no fabricated data). */
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function send(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: answer(q, markets) }]);
      setThinking(false);
    }, 500);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlighter-green/12 text-highlighter-green">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-[1.6rem] leading-none tracking-[-0.03em]">Brink AI</h1>
          <p className="text-[12px] text-muted-sage/55">Natural-language market discovery · live soon</p>
        </div>
        <span className="ml-auto rounded-full bg-highlighter-green/12 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-highlighter-green">
          Live
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
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-sage/60" style={{ animationDelay: d * 0.12 + "s" }} />
              ))}
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
              onClick={() => send(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-muted-sage/80 transition hover:border-white/[0.16] hover:text-bone-white"
            >
              <Sparkles className="h-3 w-3 text-highlighter-green" /> {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Brink AI…"
          className="h-9 flex-1 bg-transparent text-[13px] text-bone-white placeholder:text-muted-sage/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-highlighter-green text-press-black transition disabled:opacity-40"
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
