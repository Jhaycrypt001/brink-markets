import { useCallback, useEffect, useState } from "react";
import { Fingerprint, ShieldCheck, Loader2 } from "lucide-react";
import { verifyBiometric } from "@/lib/biometric";

/**
 * BiometricLock — the full-screen gate shown when the App Lock is enabled and
 * the terminal has not yet been unlocked this session. It requires the device
 * biometric (Touch ID / Windows Hello / fingerprint / Face ID) before revealing
 * the dashboard. Auto-prompts on mount; a manual retry covers a cancel.
 */
export function BiometricLock({ onUnlock }: { onUnlock: () => void }) {
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const unlock = useCallback(async () => {
    setStatus("verifying");
    setMessage("");
    try {
      const ok = await verifyBiometric();
      if (ok) {
        onUnlock();
        return;
      }
      setStatus("error");
      setMessage("Verification didn't complete. Try again.");
    } catch {
      setStatus("error");
      setMessage("Couldn't verify. Use your fingerprint or face to unlock.");
    }
  }, [onUnlock]);

  // Prompt once automatically as soon as the lock mounts.
  useEffect(() => {
    void unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0f0d] px-4">
      <div className="w-full max-w-sm text-center">
        <span
          className={[
            "mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border transition-colors",
            status === "verifying"
              ? "border-highlighter-green/40 bg-highlighter-green/10 text-highlighter-green"
              : "border-white/[0.08] bg-white/[0.03] text-muted-sage/70"
          ].join(" ")}
        >
          {status === "verifying" ? (
            <Loader2 className="h-9 w-9 animate-spin" />
          ) : (
            <Fingerprint className="h-9 w-9" />
          )}
        </span>

        <h1 className="mt-6 font-display text-[1.9rem] leading-none tracking-[-0.03em] text-bone-white">
          Brink is locked
        </h1>
        <p className="mt-3 text-[13px] text-muted-sage/60">
          {status === "verifying"
            ? "Confirm with your fingerprint or face…"
            : "Unlock the terminal with your device biometric."}
        </p>

        {status === "error" && message && (
          <p className="mt-4 text-[12px] text-[#e08a8a]">{message}</p>
        )}

        <button
          type="button"
          onClick={() => void unlock()}
          disabled={status === "verifying"}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-highlighter-green py-3.5 text-[12px] font-bold uppercase tracking-wider text-press-black transition hover:brightness-105 disabled:opacity-50"
        >
          <Fingerprint className="h-4 w-4" />
          {status === "verifying" ? "Waiting…" : "Unlock"}
        </button>

        <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-muted-sage/40">
          <ShieldCheck className="h-3.5 w-3.5" />
          Device lock only — your wallet still signs every trade.
        </p>
      </div>
    </div>
  );
}
