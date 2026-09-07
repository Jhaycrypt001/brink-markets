import { useState, useCallback, useEffect } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * DancingLetters — splits text into per-letter spans that spring in on mount and
 * "dance" (each with its own physics animation) on hover or tap. Adapted for
 * this project to import from framer-motion (already a dependency) instead of a
 * separate `motion` package. Spaces are preserved and non-interactive.
 */

type DancingLettersProps = {
  text?: string;
  className?: string;
  letterClassName?: string;
};

const letterAnimations = [
  {
    active: {
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1]
    },
    transition: { duration: 0.8, ease: "easeInOut" },
    transformOrigin: "center center"
  },
  {
    active: { rotate: [0, 12, -8, 6, -3, 0], y: [0, 6, -4, 3, -1, 0] },
    transition: { duration: 1.0, ease: [0.175, 0.885, 0.32, 1.275] },
    transformOrigin: "bottom left"
  },
  {
    active: { scaleY: [1, 0.6, 1.2, 1], y: [0, 12, -22, 0] },
    transition: { duration: 0.6, ease: "easeOut" },
    transformOrigin: "bottom center"
  },
  {
    active: { y: [0, -18, 0], scale: [1, 1.12, 1] },
    transition: { duration: 0.9, ease: "easeInOut" },
    transformOrigin: "center center"
  },
  {
    active: { x: [0, -12, 9, -6, 3, 0] },
    transition: { duration: 0.7, ease: "easeInOut" },
    transformOrigin: "center center"
  },
  {
    active: { scale: [1, 1.32, 1] },
    transition: { duration: 0.45, ease: "easeInOut" },
    transformOrigin: "center center"
  }
];

export function DancingLetters({
  text = "ANIMATE",
  className = "",
  letterClassName = ""
}: DancingLettersProps) {
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const letters = text.split("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const trigger = useCallback((index: number) => {
    setActiveIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const clear = useCallback((index: number) => {
    setActiveIndices((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <m.span
        className={cn("inline-flex flex-wrap items-end", className)}
        style={{ perspective: "1000px" }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.04 } }
        }}
      >
        {letters.map((letter, id) => {
          if (letter === " ") {
            return (
              <span key={`space-${id}`} aria-hidden="true">
                &nbsp;
              </span>
            );
          }
          const anim = letterAnimations[id % letterAnimations.length];
          const isActive = activeIndices.has(id);

          return (
            <m.span
              key={`${letter}-${id}`}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.85 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scaleX: 1,
                  scaleY: 1,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                },
                active: {
                  ...anim.active,
                  opacity: 1,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  transition: anim.transition as any
                }
              }}
              animate={isActive ? "active" : isLoaded ? "visible" : undefined}
              onHoverStart={() => trigger(id)}
              onTap={() => trigger(id)}
              onAnimationComplete={(definition) => {
                if (definition === "active") clear(id);
              }}
              className={cn(
                "relative inline-block cursor-pointer",
                isActive ? "z-10" : "z-0",
                letterClassName
              )}
              style={{
                transformOrigin: anim.transformOrigin,
                transformStyle: "preserve-3d"
              }}
            >
              {letter}
            </m.span>
          );
        })}
      </m.span>
    </LazyMotion>
  );
}

export default DancingLetters;
