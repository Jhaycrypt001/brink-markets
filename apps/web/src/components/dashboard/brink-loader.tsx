import { useEffect } from "react";
import { useAnimate, useReducedMotion } from "framer-motion";
import { BrinkMark } from "@/components/ui/brink-mark";

/**
 * BrinkLoader — the entrance to the live feed. A 3D ping-pong ball bounces
 * across the stage, then squashes, pops, and morphs into the Brink mark before
 * the overlay clears to reveal the dashboard. Click/tap skips; reduced-motion
 * visitors bypass it entirely.
 */
export function BrinkLoader({ onComplete }: { onComplete: () => void }) {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      onComplete();
      return;
    }

    let cancelled = false;
    const amp = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    const times = [0, 0.2, 0.4, 0.6, 0.8, 1];

    const run = async () => {
      // Ping-pong bounce across the stage, with a subtle squash on each contact.
      await animate(
        ".pp-ball",
        {
          x: [0, amp, -amp * 0.8, amp * 0.6, -amp * 0.4, 0],
          y: [-amp * 0.6, amp * 0.55, -amp * 0.4, amp * 0.3, -amp * 0.15, 0],
          rotateZ: [0, 120, 220, 300, 340, 360],
          scaleX: [1, 0.92, 1.06, 0.94, 1.03, 1],
          scaleY: [1, 1.08, 0.94, 1.06, 0.97, 1]
        },
        { duration: 2.1, ease: "easeInOut", times }
      );
      if (cancelled) return;

      // Squash + pop.
      await animate(".pp-ball", { scaleX: 1.18, scaleY: 0.82 }, { duration: 0.12 });
      await animate(".pp-ball", { scaleX: 1, scaleY: 1 }, { duration: 0.12 });
      if (cancelled) return;

      // Morph: green ring flashes out, ball collapses, the mark blooms in.
      void animate(
        ".pp-ring",
        { scale: [0.3, 2.6], opacity: [0.85, 0] },
        { duration: 0.65, ease: "easeOut" }
      );
      await animate(".pp-ball", { scale: 0.3, opacity: 0 }, { duration: 0.32, ease: "easeIn" });
      if (cancelled) return;

      await animate(
        ".pp-mark",
        { opacity: 1, scale: [0.3, 1], rotate: [-150, 0] },
        { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
      );
      await new Promise((resolve) => setTimeout(resolve, 380));
      if (cancelled) return;

      await animate(scope.current, { opacity: 0 }, { duration: 0.5, ease: "easeInOut" });
      if (!cancelled) onComplete();
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={scope}
      onClick={onComplete}
      role="progressbar"
      aria-label="Entering the live feed"
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-press-black"
      style={{ perspective: "900px" }}
    >
      <div className="relative flex items-center justify-center [transform-style:preserve-3d]">
        {/* green ring flash */}
        <span className="pp-ring absolute h-24 w-24 rounded-full border-2 border-highlighter-green opacity-0" />

        {/* 3D ping-pong ball */}
        <span
          className="pp-ball absolute h-[72px] w-[72px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, #ffffff 0%, #e9f7ec 22%, #9fd8ab 55%, #2bee4b 82%, #12a52c 100%)",
            boxShadow:
              "inset -8px -10px 18px rgba(0,0,0,0.35), inset 6px 6px 10px rgba(255,255,255,0.55), 0 24px 40px -12px rgba(16,94,29,0.7)"
          }}
        />

        {/* the mark it becomes */}
        <BrinkMark className="pp-mark h-24 w-24 text-bone-white opacity-0" />
      </div>

      <p className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-sage/60">
        Entering live feed
      </p>
    </div>
  );
}
