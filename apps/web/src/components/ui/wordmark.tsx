import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** Bone-white treatment for dark surfaces. */
  inverted?: boolean;
};

/**
 * Brand lockup. The 2px highlighter rule beneath the word IS the logo — no
 * icon, no frame, per the design system.
 *
 * TODO: the real Brink mark is not designed yet. When it lands, render it to
 * the left of the word here and keep the underline treatment on the wordmark.
 */
export function Wordmark({ className, inverted = false }: WordmarkProps) {
  return (
    <span className={cn("inline-flex flex-col items-start gap-1.5", className)}>
      <span
        className={cn(
          "text-[0.9375rem] font-[550] uppercase leading-none tracking-[0.14em]",
          inverted ? "text-bone-white" : "text-press-black"
        )}
      >
        Brink
      </span>
      <span aria-hidden="true" className="h-[2px] w-full bg-highlighter-green" />
    </span>
  );
}
