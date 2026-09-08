import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * PremiumToggle — a bouncy, tactile switch. Adapted from the reference to the
 * Brink dark/green tokens: the ON track is highlighter-green, the thumb is bone
 * with an overshoot spring, and it presses in on click. Persists nothing itself
 * — the caller owns state via defaultChecked + onChange.
 */
export function PremiumToggle({
  defaultChecked = false,
  onChange,
  label
}: {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
}) {
  const [isChecked, setIsChecked] = useState(defaultChecked);
  const [isPressed, setIsPressed] = useState(false);

  const handleToggle = () => {
    const next = !isChecked;
    setIsChecked(next);
    onChange?.(next);
  };

  return (
    <div className="flex items-center gap-3">
      {label && (
        <span
          className={cn(
            "text-[13px] font-medium transition-colors duration-300",
            isChecked ? "text-bone-white" : "text-muted-sage/60"
          )}
        >
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        onClick={handleToggle}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={cn(
          "group relative h-7 w-[52px] rounded-full p-1 transition-all duration-500 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlighter-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-press-black",
          isChecked ? "bg-highlighter-green" : "bg-white/[0.12]"
        )}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-500",
            isChecked ? "opacity-100 shadow-[0_0_18px_rgba(43,238,75,0.45)]" : "opacity-0"
          )}
        />
        <span
          className={cn(
            "absolute inset-[2px] rounded-full transition-all duration-500",
            isChecked ? "bg-gradient-to-b from-highlighter-green to-[#25c93f]" : "bg-transparent"
          )}
        />
        <span
          className={cn(
            "relative block h-5 w-5 rounded-full bg-bone-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
            isChecked ? "translate-x-[24px]" : "translate-x-0",
            isPressed && "scale-90 duration-150"
          )}
        >
          <span className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white via-bone-white to-muted-sage/30" />
          <span
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500",
              isChecked ? "h-2 w-2 bg-highlighter-green" : "h-1.5 w-1.5 bg-newsprint-gray/50"
            )}
          />
        </span>
      </button>
    </div>
  );
}

export default PremiumToggle;
