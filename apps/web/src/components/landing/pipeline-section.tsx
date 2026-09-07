import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue
} from "framer-motion";
import { Reveal } from "@/components/ui/motion";

const steps = [
  {
    index: "01",
    title: "Discover",
    body: "Brink loads every live DreamDEX binary market and its on-chain state in one pass."
  },
  {
    index: "02",
    title: "Score",
    body: "A deterministic score ranks each market on status, freshness, spread, and headroom."
  },
  {
    index: "03",
    title: "Preflight",
    body: "Before an order, the book and Trading state are re-read so nothing acts on stale data."
  },
  {
    index: "04",
    title: "Sign",
    body: "Execution returns to your wallet — an explicit, chain-verified, user-signed order."
  }
];

export function PipelineSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  return (
    <section
      ref={ref}
      className="border-b border-press-black/15 py-20 lg:py-28"
    >
      <div className="page-shell grid gap-14 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal from="up">
            <p className="eyebrow text-newsprint-gray">The path to a trade</p>
            <h2 className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.04em] text-press-black [text-wrap:balance]">
              Four steps. No custody in between.
            </h2>
            <p className="mt-7 max-w-[420px] text-body text-slate-verdant">
              Every market moves through the same pipeline. Discovery and scoring
              are automatic; the last two steps stay in your hands.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6">
          {steps.map((step, i) => (
            <PipelineCard
              key={step.index}
              step={step}
              order={i}
              progress={scrollYProgress}
              reduceMotion={reduceMotion ?? false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PipelineCard({
  step,
  order,
  progress,
  reduceMotion
}: {
  step: (typeof steps)[number];
  order: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // Cards drift horizontally as the section scrolls — alternating sides — so the
  // stack feels alive without leaving the reader's line.
  const direction = order % 2 === 0 ? 1 : -1;
  const x = useTransform(progress, [0, 1], [direction * 48, direction * -48]);

  return (
    <motion.article
      style={reduceMotion ? undefined : { x }}
      initial={reduceMotion ? undefined : { opacity: 0, y: 40 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.6, delay: order * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group flex items-center gap-6 rounded-card border border-press-black/15 bg-bone-white p-7 transition-colors hover:border-press-black/40 md:gap-10 md:p-9"
    >
      <span className="font-display text-[2.5rem] leading-none tracking-[-0.04em] text-newsprint-gray md:text-[3.25rem]">
        {step.index}
      </span>
      <div className="flex-1">
        <h3 className="font-display text-[1.75rem] leading-none tracking-[-0.02em] text-press-black">
          {step.title}
        </h3>
        <p className="mt-3 max-w-[520px] text-body-sm text-newsprint-gray">
          {step.body}
        </p>
      </div>
      <ArrowRight
        className="hidden h-5 w-5 shrink-0 text-press-black transition-transform group-hover:translate-x-1 md:block"
        aria-hidden="true"
      />
    </motion.article>
  );
}
