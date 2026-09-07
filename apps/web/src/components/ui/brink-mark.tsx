import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Brink mark — a solid disc with a single thin sliver cleaved from its edge,
 * frozen the instant before it tips past "the brink". Drawn as vector so it is
 * crisp at any size; it fills with `currentColor` and the cleave gap is
 * transparent, so the mark drops onto any surface (bone, press-black, the green
 * band) and reads correctly against whatever is behind it.
 */
export function BrinkMark({
  className,
  title = "Brink"
}: {
  className?: string;
  title?: string;
}) {
  const raw = useId();
  const maskId = `brink-cleave-${raw.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block", className)}
      role="img"
      aria-label={title}
      fill="currentColor"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          {/* white = mark visible, black = transparent cleave */}
          <circle cx="50" cy="50" r="40" fill="#fff" />
          <path d="M68 1 L70.6 1 L73.6 99 L71 99 Z" fill="#000" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="40" mask={`url(#${maskId})`} />
    </svg>
  );
}

export default BrinkMark;
