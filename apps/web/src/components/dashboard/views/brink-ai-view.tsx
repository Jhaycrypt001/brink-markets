import { useState, useRef, useEffect } from "react";
import { Bot, ArrowUp, Sparkles } from "lucide-react";
import { PANEL } from "./_shared";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Which markets clear every gate right now?",
  "Explain the score on the top BTC market",
  "Anything expiring in under 10 minutes?",
  "Compare ETH and SOL spreads"
];

const SEED: Msg[] = [
  { role: "ai", text: "I'm Brink AI. Ask me to surface markets, explain a score, or watch for a setup — I read the same live feed the terminal does." }
];

function canned(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("gate") || p.includes("tradeable"))
    return "4 markets clear every gate: BTC ≥ $72k (92.4), ETH ≥ $3,850 (88.1), SOL ≥ $185 (81.7), and BTC ≤ $70.5k (74.3). All are Trading on-chain with fresh two-sided books.";
  if (p.includes("score"))
    return "The top BTC market scores 92.4: +35 on-chain Trading, +20 expiry headroom (41m left), +15 fresh book (<15s), a tight 2pt spread, plus volume and trade-count weight. Nothing overrides an on-chain gate.";
  if (p.includes("expir"))
    return "Two markets expire under 10 minutes: SOL ≥ $190 (4m, score 58.2) and BTC ≥ $73.5k (3m, 41.5). Both are inside the expiry gate, so they read as diagnostic — not tradeable.";
  if (p.includes("spread") || p.includes("compare"))
    return "ETH is tighter: 3pt spread at 47¢ ask vs SOL's 4pt at 66¢. ETH also scores higher (88.1 vs 81.7) on fresher liquidity.";
  return "On the live feed I'd rank by score, then filter on your gates. Wire the API and I'll answer against real-time books.";
}

export function BrinkAiView() {
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
      setMessages((m) => [...m, { role: "ai", text: canned(q) }]);
      setThinking(false);
    }, 700);
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
