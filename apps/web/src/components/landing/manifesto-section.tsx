import { useRef, type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue
} from "framer-motion";

/**
 * Manifesto — a tall, pinned editorial statement. As the reader scrolls the
 * section, a green "highlighter" swipes across the emphasized lines in
 * sequence, the way a printed page gets marked up. Each line is its own block
 * so the large display type never overlaps, and reduced-motion visitors get the
 * fully highlighted statement with no scroll dependency.
 */

const lines = [
  { text: "Most event-contract feeds go stale", highlight: false },
  { text: "before the clock does.", highlight: true },
  { text: "Brink reads the chain, the book,", highlight: false },
  { text: "and the spread in real time —", highlight: false },
  { text: "so the market you act on", highlight: false },
  { text: "is the market that exists.", highlight: true }
];

export function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  // Index of each highlighted line among the highlighted ones (for timing).
  let highlightOrder = -1;

  return (
    <section ref={ref} className="relative h-[220vh] bg-press-black text-bone-white">
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden py-24">
        <div className="page-shell">
          <p className="eyebrow text-highlighter-green">The premise</p>
          <h2 className="mt-8 flex max-w-[1180px] flex-col gap-y-2 font-display text-[clamp(1.9rem,5.6vw,4.75rem)] font-normal leading-[1.2] tracking-[-0.02em] sm:gap-y-3">
            {lines.map((line) => {
              if (!line.highlight) {
                return (
                  <span key={line.text} className="block text-muted-sage">
                    {line.text}
                  </span>
                );
              }
              highlightOrder += 1;
              return (
                <HighlightedLine
                  key={line.text}
                  text={line.text}
                  order={highlightOrder}
                  progress={scrollYProgress}
                  reduceMotion={reduceMotion ?? false}
                />
              );
            })}
          </h2>
        </div>
      </div>
    </section>
  );
}

function HighlightedLine({
  text,
  order,
  progress,
  reduceMotion
}: {
  text: string;
  order: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // Each highlighted line fills over its own slice of the scroll timeline.
  const start = 0.2 + order * 0.28;
  const marker = useTransform(progress, [start, start + 0.26], ["0%", "100%"]);

  return (
    <span className="block">
      <motion.span
        className="marker-highlight box-decoration-clone text-bone-white"
        style={
          reduceMotion
            ? ({ ["--marker" as string]: "100%" } as CSSProperties)
            : ({ ["--marker" as string]: marker } as unknown as CSSProperties)
        }
      >
        {text}
      </motion.span>
    </span>
  );
}
