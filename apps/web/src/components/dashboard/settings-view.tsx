import { useState, type ReactNode } from "react";
import { Copy, Check, Shield, Bell, Sparkles } from "lucide-react";
import { PremiumToggle } from "@/components/ui/bouncy-toggle";
import { useWallet, shortAddress } from "@/components/dashboard/wallet";
import { cn } from "@/lib/utils";

const PANEL = "rounded-xl border border-white/[0.06] bg-white/[0.015]";

/**
 * SettingsView — profile card plus real, persisted preference toggles. Effects
 * are intentionally light (this is a read-only discovery surface), but every
 * control reflects and stores genuine state.
 */
export function SettingsView() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[2rem] leading-none tracking-[-0.03em]">Settings</h1>
        <p className="mt-2 text-[13px] text-muted-sage/60">Your profile and terminal preferences.</p>
      </div>

      <ProfileCard />

      <Section title="Preferences" icon={Sparkles}>
        <Toggle storageKey="brink.pref.compact" label="Compact density" hint="Tighten spacing across the terminal." />
        <Toggle storageKey="brink.pref.reduceMotion" label="Reduce motion" hint="Minimize animations and transitions." />
        <Toggle storageKey="brink.pref.sound" label="Fill sounds" hint="Play a tick when a market turns tradeable." defaultOn={false} />
      </Section>

      <Section title="Notifications" icon={Bell}>
        <Toggle storageKey="brink.notify.tradeable" label="Tradeable alerts" hint="Notify when a market clears every gate." />
        <Toggle storageKey="brink.notify.expiry" label="Expiry warnings" hint="Warn when a held market nears expiry." />
      </Section>

      <Section title="Security" icon={Shield}>
        <Row label="API access" value="Read-only" />
        <Row label="Order signing" value="Wallet-held" />
        <Row label="Network" value="Somnia Shannon" />
      </Section>
    </div>
  );
}

function ProfileCard() {
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!wallet.address) return;
    navigator.clipboard?.writeText(wallet.address).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      },
      () => undefined
    );
  }

  return (
    <div className={cn(PANEL, "flex flex-wrap items-center gap-4 p-5")}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-highlighter-green to-[#12a52c] text-[22px] font-bold text-press-black">
        JT
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold text-bone-white">Guest Trader</p>
        {wallet.ready ? (
          <button onClick={copy} className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted-sage/60 hover:text-bone-white">
            {shortAddress(wallet.address ?? "")} · Somnia
            {copied ? <Check className="h-3.5 w-3.5 text-highlighter-green" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <p className="mt-1 text-[12px] text-muted-sage/50">Not connected</p>
        )}
      </div>
      {wallet.ready ? (
        <button
          onClick={wallet.disconnect}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-muted-sage/80 hover:text-bone-white"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={wallet.open}
          className="rounded-lg bg-highlighter-green px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-press-black hover:brightness-105"
        >
          Connect wallet
        </button>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Shield; children: ReactNode }) {
  return (
    <div className={cn(PANEL, "overflow-hidden")}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
        <Icon className="h-4 w-4 text-muted-sage/60" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">{title}</span>
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

function Toggle({
  storageKey,
  label,
  hint,
  defaultOn = true
}: {
  storageKey: string;
  label: string;
  hint: string;
  defaultOn?: boolean;
}) {
  const initial = (() => {
    try {
      const v = localStorage.getItem(storageKey);
      return v === null ? defaultOn : v === "true";
    } catch {
      return defaultOn;
    }
  })();

  function persist(next: boolean) {
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div>
        <p className="text-[13px] font-medium text-bone-white">{label}</p>
        <p className="mt-0.5 text-[12px] text-muted-sage/55">{hint}</p>
      </div>
      <PremiumToggle defaultChecked={initial} onChange={persist} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-[13px] text-muted-sage/70">{label}</span>
      <span className="text-[13px] font-semibold text-bone-white">{value}</span>
    </div>
  );
}
