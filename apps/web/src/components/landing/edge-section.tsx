import { ScrollAssembleText } from "@/components/ui/text-scroll-animation";

/**
 * Edge — a dark interstitial whose headline assembles from scattered characters
 * as the section scrolls, breaking the rhythm between the market feed and the
 * pipeline. Green brackets frame the line as a branded pull-quote.
 */
export function EdgeSection() {
  return (
    <section className="relative bg-press-black text-bone-white">
      <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2">
        <span className="eyebrow text-highlighter-green">Scroll to assemble</span>
      </div>

      <ScrollAssembleText
        text="THE EDGE, IN REAL TIME"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-center text-center font-sans text-[clamp(2.25rem,7vw,6rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em] text-bone-white"
      />
    </section>
  );
}
