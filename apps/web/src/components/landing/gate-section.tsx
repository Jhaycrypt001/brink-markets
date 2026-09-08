import { ArrowUpRight } from "lucide-react";
import { DuotoneTile } from "@/components/ui/duotone-tile";

/**
 * The four conditions in the `tradeable` predicate — `apps/api/src/domain/
 * scoring.ts`. All four must hold; there is no partial credit and no override.
 */
const gates = [
  {
    ordinal: "I",
    title: "Trading on-chain",
    detail:
      "The contract's own status must read Trading. Locked, Resolved, and Finalized markets are still readable, but they are never short-listed.",
    measure: "status === Trading"
  },
  {
    ordinal: "II",
    title: "Five minutes of headroom",
    detail:
      "Under 300 seconds to expiry, a fill stops being a position and starts being a coin toss. Brink holds those back rather than dressing them up.",
    measure: "secondsLeft ≥ 300"
  },
  {
    ordinal: "III",
    title: "A book worth quoting",
    detail:
      "Every level is bounds-checked, and the snapshot must be under fifteen seconds old — with no timestamp from the future, which is how a broken feed usually announces itself.",
    measure: "bookAge ≤ 15s"
  },
  {
    ordinal: "IV",
    title: "Something to actually hit",
    detail:
      "A market with no best ask cannot be entered at any price. It scores, it appears in diagnostics, and it stays off the short list.",
    measure: "bestAsk !== undefined"
  }
];

export function GateSection() {
  return (
    <section id="gates" className="bg-press-black text-bone-white">
      <div className="page-shell py-16 md:py-20">
        <header className="grid gap-8 border-b rule-dark pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="micro-label text-muted-sage">02 — Hard gates</p>
            <h2 className="display-type mt-5 max-w-[16ch] text-heading-sm text-bone-white">
              Four ways to be excluded.
            </h2>
          </div>
          <p className="max-w-[52ch] text-body text-muted-sage [text-wrap:pretty]">
            A score is a ranking device, and a ranking device will happily put a
            bad market first if nothing stops it. These four checks run before
            any score is compared, and every one of them is a veto.
          </p>
        </header>

        <ol className="mt-14 grid gap-x-5 gap-y-12 md:grid-cols-2 lg:gap-y-16">
          {gates.map((gate) => (
            <li key={gate.title} className="border-t rule-dark pt-6">
              <div className="flex items-baseline justify-between gap-5">
                <span className="display-type text-subheading text-shadow-moss">
                  {gate.ordinal}
                </span>
                <code
                  data-numeric
                  className="micro-label rounded-pill border rule-dark px-3 py-1.5 text-muted-sage"
                >
                  {gate.measure}
                </code>
              </div>
              <h3 className="mt-6 text-title text-bone-white">{gate.title}</h3>
              <p className="mt-4 max-w-[46ch] text-body-sm text-muted-sage [text-wrap:pretty]">
                {gate.detail}
              </p>
            </li>
          ))}
        </ol>

        {/* The counterpoint: a failed gate suppresses the ranking, not the
            record. Set against a tile so the section doesn't end on a list. */}
        <div className="mt-20 grid gap-10 border-t rule-dark pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-20">
          <DuotoneTile
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=720&q=80"
            alt="Printed figures spread across a desk"
            width={360}
            height={240}
            caption="Fig. 03 — Diagnostics, retained"
            className="max-w-[420px]"
          />

          <div>
            <p className="editorial-type max-w-[26ch] text-subheading text-bone-white">
              Excluded is not the same as hidden.
            </p>
            <p className="mt-8 max-w-[54ch] text-body text-muted-sage [text-wrap:pretty]">
              Ask for <code data-numeric>tradeableOnly=false</code> and the API
              returns everything it scored, each market carrying the plain-English
              reasons it failed. The short list is an opinion; the full ledger
              stays available so you can disagree with it.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <a href="#scoring" className="action-ghost micro-label">
                How the 100 points split
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
              <a href="#api" className="action-ghost micro-label">
                Read the query contract
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
