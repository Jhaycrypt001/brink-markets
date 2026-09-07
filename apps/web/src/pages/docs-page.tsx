import { ArrowUpRight, Terminal, Boxes, ShieldCheck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { GlassButton } from "@/components/ui/glass-button";

const endpoints = [
  {
    method: "GET",
    path: "/health",
    body: "Liveness probe. Returns { ok, service, requestId }."
  },
  {
    method: "GET",
    path: "/v1/markets",
    body: "Scored, ranked markets. Query: asset, minScore, tradeableOnly, limit."
  },
  {
    method: "GET",
    path: "/v1/markets/:marketId",
    body: "A single scored market by id, with quotes, spread, and reasons."
  }
];

const fields = [
  ["marketId, symbol, question, asset", "Identity of the event contract."],
  ["status", "On-chain state — only \"Trading\" can be tradeable."],
  ["bestBid, bestAsk, spread", "Top of book and the two-sided spread."],
  ["secondsLeft", "Headroom before expiry, in seconds."],
  ["score", "Deterministic 0–100 rank, highest first."],
  ["tradeable", "True only when every safety gate passes."],
  ["reasons", "Human-readable explanation behind the score."]
];

const guarantees = [
  {
    icon: ShieldCheck,
    title: "Read-only",
    body: "No order, custody, or private-key endpoint exists on the API surface."
  },
  {
    icon: Boxes,
    title: "Deterministic",
    body: "The same market always returns the same score and the same reasons."
  },
  {
    icon: Terminal,
    title: "JSON-safe",
    body: "Every payload is plain JSON — raw bigint book levels never leak through."
  }
];

export function DocsPage() {
  return (
    <main>
      {/* Header band */}
      <section className="border-b border-press-black/15 py-20 lg:py-28">
        <div className="page-shell">
          <Reveal from="up">
            <p className="eyebrow text-newsprint-gray">Documentation</p>
            <h1 className="mt-6 font-display text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-[-0.05em] text-press-black [text-wrap:balance]">
              The Brink API, end to end.
            </h1>
            <p className="mt-7 max-w-[680px] text-body text-slate-verdant [text-wrap:pretty]">
              Brink is a read-only discovery layer over DreamDEX event contracts.
              It ranks live markets and explains every score; execution stays in
              your wallet. This page covers the endpoints, the shape of a market,
              and the guarantees behind the numbers.
            </p>
          </Reveal>

          <Reveal from="up" delay={0.1}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GlassButton href="/#markets" tone="green" size="lg" contentClassName="gap-2">
                See it live
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </GlassButton>
              <GlassButton href="#endpoints" tone="light" size="lg">
                Jump to endpoints
              </GlassButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quick start */}
      <section className="bg-press-black py-20 text-bone-white lg:py-28">
        <div className="page-shell grid gap-14 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20">
          <Reveal from="up">
            <p className="eyebrow text-muted-sage">Quick start</p>
            <h2 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.04em] text-bone-white [text-wrap:balance]">
              Running in two commands.
            </h2>
            <p className="mt-7 max-w-[420px] text-body text-muted-sage">
              The API defaults to 127.0.0.1:8787. Point the web client elsewhere
              with VITE_API_BASE_URL.
            </p>
          </Reveal>

          <Reveal from="up" delay={0.1}>
            <div className="border border-bone-white/25 bg-slate-verdant/60 p-6 md:p-8">
              <p className="eyebrow text-highlighter-green">Terminal</p>
              <pre className="mt-4 overflow-x-auto text-body-sm leading-relaxed text-bone-white">
                <code>{`npm install
npm run dev:api      # API on :8787
npm run dev:web      # landing on :5173

curl http://127.0.0.1:8787/v1/markets?tradeableOnly=true&limit=3`}</code>
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Endpoints */}
      <section id="endpoints" className="border-b border-press-black/15 py-20 lg:py-28">
        <div className="page-shell">
          <Reveal from="up">
            <p className="eyebrow text-newsprint-gray">Endpoints</p>
            <h2 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.04em] text-press-black [text-wrap:balance]">
              Three read routes.
            </h2>
          </Reveal>

          <Stagger className="mt-12 grid gap-px border border-press-black/15 bg-press-black/15 md:grid-cols-3">
            {endpoints.map((endpoint) => (
              <StaggerItem key={endpoint.path} className="bg-bone-white p-7">
                <span className="inline-flex rounded-button bg-echo-green px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11px] text-press-black">
                  {endpoint.method}
                </span>
                <p className="mt-5 break-words font-display text-[1.5rem] leading-tight tracking-[-0.02em] text-press-black">
                  {endpoint.path}
                </p>
                <p className="mt-3 text-body-sm text-newsprint-gray">{endpoint.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Market shape */}
      <section className="border-b border-press-black/15 py-20 lg:py-28">
        <div className="page-shell grid gap-14 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-20">
          <Reveal from="up">
            <p className="eyebrow text-newsprint-gray">Response shape</p>
            <h2 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.04em] text-press-black [text-wrap:balance]">
              What a market carries.
            </h2>
            <p className="mt-7 max-w-[380px] text-body text-slate-verdant">
              Every result in the list is normalized and self-describing — the
              score never travels without its reasons.
            </p>
          </Reveal>

          <Stagger className="divide-y divide-press-black/15 border-y border-press-black/15">
            {fields.map(([name, desc]) => (
              <StaggerItem
                key={name}
                from="right"
                className="grid gap-2 py-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-8"
              >
                <code className="text-body-sm font-semibold text-press-black">{name}</code>
                <p className="text-body-sm text-newsprint-gray">{desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Guarantees */}
      <section className="bg-press-black py-20 text-bone-white lg:py-28">
        <div className="page-shell">
          <Reveal from="up">
            <p className="eyebrow text-muted-sage">Guarantees</p>
            <h2 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.04em] text-bone-white [text-wrap:balance]">
              What the contract promises.
            </h2>
          </Reveal>

          <Stagger className="mt-12 grid gap-px border border-bone-white/20 bg-bone-white/20 md:grid-cols-3">
            {guarantees.map((item) => (
              <StaggerItem key={item.title} className="bg-press-black p-7">
                <item.icon className="h-5 w-5 text-highlighter-green" aria-hidden="true" />
                <h3 className="mt-5 text-body font-medium text-bone-white">{item.title}</h3>
                <p className="mt-2 text-body-sm text-muted-sage">{item.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </main>
  );
}
