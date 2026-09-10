import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * ScrollAssembleText — a headline whose characters start scattered (spread out
 * from the center, tilted in 3D) and lock into place as the section scrolls
 * through the viewport. Adapted from the Skiper "text-scroll-animation" pattern
 * to the Brink tokens: no fixed colors (inherits via className), no external
 * smooth-scroll dependency, and a static, assembled render for reduced-motion.
 */

type CharProps = {
  char: string;
  index: number;
  centerIndex: number;
  progress: MotionValue<number>;
  spread: number;
};

function Character({ char, index, centerIndex, progress, spread }: CharProps) {
  const distance = index - centerIndex;
  const x = useTransform(progress, [0, 0.5], [distance * spread, 0]);
  const rotateX = useTransform(progress, [0, 0.5], [distance * 40, 0]);
  const opacity = useTransform(progress, [0, 0.42], [0.12, 1]);
  const isSpace = char === " ";

  return (
    <motion.span
      className={cn("inline-block will-change-transform", isSpace && "w-[0.32em]")}
      style={{ x, rotateX, opacity }}
    >
      {isSpace ? " " : char}
    </motion.span>
  );
}

export function ScrollAssembleText({
  text,
  className
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const characters = [...text];
  const centerIndex = Math.floor(characters.length / 2);
  // Scale the scatter distance to the viewport so characters don't fling off a
  // phone screen. The outermost char sits at (chars/2 * spread) px from center,
  // so cap the total spread to roughly the available half-width.
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const halfCount = Math.max(1, centerIndex);
  const spread = Math.min(42, Math.floor((viewportWidth * 0.42) / halfCount));

  if (reduceMotion) {
    return (
      <div ref={ref}>
        <p className={className}>{text}</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="h-[200vh]">
      <div className="sticky top-0 flex min-h-screen items-center justify-center overflow-hidden px-6">
        <p className={className} style={{ perspective: "600px" }}>
          {characters.map((char, index) => (
            <Character
              key={index}
              char={char}
              index={index}
              centerIndex={centerIndex}
              progress={scrollYProgress}
              spread={spread}
            />
          ))}
        </p>
      </div>
    </div>
  );
}

export default ScrollAssembleText;
