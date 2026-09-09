import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PromptBox — a ChatGPT-style composer, themed for the Brink terminal and wired
 * to the real Brink AI backend by its parent. Auto-grows with the text, submits
 * on Enter (Shift+Enter for a newline), and disables while a reply is in flight.
 * Deliberately free of non-functional tool buttons — every control here does
 * something real.
 */
export function PromptBox({
  value,
  onChange,
  onSubmit,
  disabled = false,
  busy = false,
  placeholder = "Ask Brink AI…",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  busy?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasValue = value.trim().length > 0;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function submit() {
    if (!hasValue || disabled) return;
    onSubmit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "flex cursor-text flex-col rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-2 shadow-sm transition-colors focus-within:border-white/[0.16]",
        className
      )}
      onClick={() => ref.current?.focus()}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled && !busy}
        className="no-scrollbar min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-bone-white placeholder:text-muted-sage/40 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-0.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-sage/45">
          <Sparkles className="h-3 w-3 text-highlighter-green/70" />
          Grounded in the live market feed
        </span>
        <button
          type="submit"
          disabled={!hasValue || disabled}
          aria-label="Send"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-highlighter-green text-press-black transition hover:brightness-105 disabled:bg-white/[0.08] disabled:text-muted-sage/40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </div>
    </form>
  );
}
