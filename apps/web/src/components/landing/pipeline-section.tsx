import { Radar, Gauge, RefreshCw, PenLine } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { MorphingCardStack, type CardData } from "@/components/ui/morphing-card-stack";

const steps: CardData[] = [
  {
    id: "discover",
    eyebrow: "01 · Discover",
    title: "Discover",
    description:
      "Brink loads every live DreamDEX binary market and its on-chain state in one pass.",
    icon: <Radar className="h-5 w-5" aria-hidden="true" />
  },
  {
    id: "score",
    eyebrow: "02 · Score",
    title: "Score",
    description:
      "A deterministic score ranks each market on status, freshness, spread, and headroom.",
    icon: <Gauge className="h-5 w-5" aria-hidden="true" />
  },
  {
    id: "preflight",
    eyebrow: "03 · Preflight",
    title: "Preflight",
    description:
      "Before an order, the book and Trading state are re-read so nothing acts on stale data.",
    icon: <RefreshCw className="h-5 w-5" aria-hidden="true" />
  },
  {
    id: "sign",
    eyebrow: "04 · Sign",
    title: "Sign",
    description:
      "Execution returns to your wallet — an explicit, chain-verified, user-signed order.",
    icon: <PenLine className="h-5 w-5" aria-hidden="true" />
  }
];

export function PipelineSection() {
  return (
    <section className="border-b border-press-black/15 py-20 lg:py-28">
      <div className="page-shell grid gap-14 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal from="up">
            <p className="eyebrow text-newsprint-gray">The path to a trade</p>
            <h2 className="mt-6 font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.04em] text-press-black [text-wrap:balance]">
              Four steps. No custody in between.
            </h2>
            <p className="mt-7 max-w-[420px] text-body text-slate-verdant">
              Every market moves through the same pipeline. Discovery and scoring
              are automatic; the last two steps stay in your hands. Stack, grid,
              or list — swipe the stack to move through it.
            </p>
          </Reveal>
        </div>

        <Reveal from="up" delay={0.1} className="w-full">
          <MorphingCardStack cards={steps} defaultLayout="stack" />
        </Reveal>
      </div>
    </section>
  );
}
