import { useRef, type ReactNode, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * TiltCard — a 3D card that rotates toward the pointer with a soft spring and a
 * moving specular sheen, then eases flat on leave. The whole surface lives on a
 * `perspective` parent; children render in 3D space. Reduced-motion visitors get
 * a plain static card.
 */
export function TiltCard({
  children,
  className,
  intensity = 10
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), {
    stiffness: 200,
    damping: 20
  });
  const ry = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), {
    stiffness: 200,
    damping: 20
  });
  const sheenX = useTransform(px, [0, 1], ["0%", "100%"]);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }

  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  if (reduceMotion) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      whileHover={{ z: 24 }}
      className={cn("relative [transform-style:preserve-3d]", className)}
    >
      {children}
      <motion.span
        aria-hidden="true"
        style={{ left: sheenX }}
        className="pointer-events-none absolute top-0 h-full w-24 -translate-x-1/2 rounded-full bg-highlighter-green/10 blur-2xl"
      />
    </motion.div>
  );
}
