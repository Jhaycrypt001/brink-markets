import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";

const scoringRules = [
  {
    points: "35",
    title: "On-chain status",
    body: "Only DreamDEX markets whose on-chain state reports Trading can become tradeable."
  },
  {
    points: "20",
    title: "Expiry headroom",
    body: "A market needs at least five minutes left; the last minutes stay diagnostic."
  },
  {
    points: "15",
    title: "Fresh order book",
    body: "The book must be valid and observed within the last fifteen seconds."
  },
  {
    points: "30",
    title: "Liquidity and activity",
    body: "Tighter spreads, more volume, more trades, and two-sided quotes raise the score."
  }
];

export function ScoringSection() {
  return (
    <section id="scoring" className="bg-press-black py-20 text-bone-white lg:py-28">
      <div className="page-shell grid gap-14 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20">
        <Reveal from="up">
          <p className="eyebrow text-muted-sage">Deterministic score</p>
          <h2 className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.04em] text-bone-white [text-wrap:balance]">
            Every Brink score is inspectable.
          </h2>
          <p className="mt-7 max-w-[420px] text-body text-muted-sage">
            The API returns the same deterministic score and human-readable
            reasons for every market. No model decides what to trade, and no
            score can override an on-chain gate.
          </p>
        </Reveal>
        <ScoringLedger />
      </div>
    </section>
  );
}

function ScoringLedger() {
  return (
    <Stagger className="divide-y divide-bone-white/20 border-y border-bone-white/20">
      {scoringRules.map((rule) => (
        <StaggerItem
          key={rule.title}
          from="right"
          className="grid gap-4 py-7 md:grid-cols-[92px_minmax(0,1fr)] md:gap-8"
        >
          <span className="font-display text-[2.5rem] leading-none text-highlighter-green">
            {rule.points}
          </span>
          <div>
            <h3 className="text-body font-medium text-bone-white">{rule.title}</h3>
            <p className="mt-2 max-w-[540px] text-body-sm text-muted-sage">
              {rule.body}
            </p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
