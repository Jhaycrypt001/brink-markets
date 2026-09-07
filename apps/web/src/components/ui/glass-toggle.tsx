import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassToggle — a 3D glass segmented control. Adapted from the styled-components
 * "3d-radio-group" reference into the project's Tailwind idiom (no new deps):
 * a translucent, inset-shadowed glass track with a raised glass thumb that
 * springs to the selected option. Themed to the Brink green.
 */

export type ToggleOption<T extends string> = { value: T; label: string };

export function GlassToggle<T extends string>({
  options,
  value,
  onChange,
  className,
  layoutId = "glass-toggle-thumb"
}: {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  layoutId?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full border border-white/10 p-1",
        "bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-8px_16px_rgba(0,0,0,0.35)] backdrop-blur-md",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.11px] transition-colors md:px-5",
              isActive ? "text-press-black" : "text-muted-sage/70 hover:text-bone-white"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-highlighter-green shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_-6px_rgba(43,238,75,0.7)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
