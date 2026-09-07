import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue
} from "framer-motion";

/**
 * Manifesto — a tall, pinned editorial statement. As the reader scrolls the
 * section, a green "highlighter" swipes across three phrases in sequence, the
 * way a printed page gets marked up. Reduced-motion visitors get the fully
 * highlighted statement with no scroll dependency.
 */

const phrases = [
  { text: "Most event-contract feeds go stale", highlight: false },
  { text: "before the clock does.", highlight: true },
  { text: "Brink reads the chain, the book, and the spread in real time —", highlight: false },
  { text: "so the market you act on is the market that exists.", highlight: true }
];

export function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  return (
    <section
      ref={ref}
      className="relative h-[240vh] bg-press-black text-bone-white"
    >
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden">
        <div className="page-shell py-24">
          <p className="eyebrow text-highlighter-green">The premise</p>
          <h2 className="mt-8 max-w-[1100px] font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.03em] [text-wrap:balance]">
            {phrases.map((phrase, index) =>
              phrase.highlight ? (
                <Highlighted
                  key={phrase.text}
                  text={phrase.text}
                  index={index}
                  progress={scrollYProgress}
                  reduceMotion={reduceMotion ?? false}
                />
              ) : (
                <span key={phrase.text} className="text-muted-sage">
                  {phrase.text}{" "}
                </span>
              )
            )}
          </h2>
        </div>
      </div>
    </section>
  );
}

function Highlighted({
  text,
  index,
  progress,
  reduceMotion
}: {
  text: string;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // Each highlighted phrase fills over its own slice of the scroll timeline.
  const start = 0.15 + index * 0.14;
  const marker = useTransform(progress, [start, start + 0.22], ["0%", "100%"]);

  return (
    <motion.span
      className="marker-highlight px-1 text-press-black"
      style={
        reduceMotion
          ? { ["--marker" as string]: "100%" }
          : { ["--marker" as string]: marker }
      }
    >
      {text}{" "}
    </motion.span>
  );
}
