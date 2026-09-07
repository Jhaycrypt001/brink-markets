import { type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants
} from "framer-motion";

/**
 * Shared scroll-motion primitives for the landing page.
 *
 * Everything here is built on `whileInView` so sections animate in as they
 * cross the viewport — the "cards move when I scroll" behavior — and every
 * primitive collapses to a static, opacity-1 render when the visitor has
 * `prefers-reduced-motion` set. Motion is craft, never a tax on accessibility.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  /** Direction the element travels in from. */
  from?: "up" | "down" | "left" | "right" | "none";
  /** Travel distance in px. */
  distance?: number;
  delay?: number;
  duration?: number;
  /** Re-run the animation every time it re-enters the viewport. */
  once?: boolean;
};

export function Reveal({
  children,
  from = "up",
  distance = 40,
  delay = 0,
  duration = 0.7,
  once = true,
  ...rest
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const offset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {}
  }[from];

  if (reduceMotion) {
    return <motion.div {...rest}>{children}</motion.div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "0px 0px -12% 0px" }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * A group whose direct <Stagger.Item> children reveal one after another.
 * Wrap a grid or list in <Stagger> and each child in <StaggerItem>.
 */
export function Stagger({
  children,
  step = 0.09,
  delay = 0,
  once = true,
  ...rest
}: HTMLMotionProps<"div"> & {
  children: ReactNode;
  step?: number;
  delay?: number;
  once?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <motion.div {...rest}>{children}</motion.div>;
  }

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: step, delayChildren: delay } }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  from = "up",
  distance = 32,
  ...rest
}: HTMLMotionProps<"div"> & {
  children: ReactNode;
  from?: "up" | "down" | "left" | "right";
  distance?: number;
}) {
  const reduceMotion = useReducedMotion();

  const offset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  }[from];

  const item: Variants = reduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.65, ease: EASE }
        }
      };

  return (
    <motion.div variants={item} {...rest}>
      {children}
    </motion.div>
  );
}
