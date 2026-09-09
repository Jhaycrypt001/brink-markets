import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Copy, Check, Shield, Bell, Sparkles, Camera, X } from "lucide-react";
import { PremiumToggle } from "@/components/ui/bouncy-toggle";
import { useWallet, shortAddress } from "@/components/dashboard/wallet";
import { usePrefs, type PrefKey } from "@/components/dashboard/prefs";
import { useProfile, ProfileAvatar, fileToAvatar } from "@/components/dashboard/profile";
import { cn } from "@/lib/utils";

const PANEL = "rounded-xl border border-white/[0.06] bg-white/[0.015]";

/**
 * SettingsView — profile card plus fully functional preferences. Every toggle
 * drives real behavior via the preferences engine: density scales the terminal,
 * reduce-motion halts animations, fill sounds play a tick, and notification
 * toggles fire real browser notifications (requesting permission when enabled).
 */
export function SettingsView() {
  const prefs = usePrefs();
  const wallet = useWallet();
  const wantsNotif = prefs.tradeableAlerts || prefs.expiryWarnings;
  // "default" → we can still ask (Allow prompt). "denied" → only the user can
  // re-enable it in browser site settings; JS cannot. Be honest about which.
  const needsAllow = wantsNotif && prefs.notifPermission === "default";
  const browserDenied = wantsNotif && prefs.notifPermission === "denied";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[2rem] leading-none tracking-[-0.03em]">Settings</h1>
        <p className="mt-2 text-[13px] text-muted-sage/60">Your profile and terminal preferences.</p>
      </div>

      <ProfileCard />

      <Section title="Preferences" icon={Sparkles}>
        <Toggle prefKey="compactDensity" label="Compact density" hint="Scale the terminal down for a denser layout." />
        <Toggle prefKey="reduceMotion" label="Reduce motion" hint="Halt animations and transitions across the app." />
        <Toggle prefKey="fillSounds" label="Fill sounds" hint="Play a tick when a market turns tradeable." />
      </Section>

      <Section title="Notifications" icon={Bell}>
        {!wallet.ready ? (
          <p className="px-5 py-4 text-[13px] text-muted-sage/60">
            Alert preferences are saved per wallet. Connect a wallet to set them — each address keeps its own.
          </p>
        ) : (
          <>
        {needsAllow && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] bg-highlighter-green/[0.04] px-5 py-3">
            <p className="text-[12px] text-[#e0b06a]">
              Your browser hasn't granted notifications yet. Enable them to receive alerts on your desktop.
            </p>
            <button
              type="button"
              onClick={prefs.requestNotifPermission}
              className="rounded-lg bg-highlighter-green px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-press-black hover:brightness-105"
            >
              Enable browser notifications
            </button>
          </div>
        )}
        {browserDenied && (
          <p className="border-b border-white/[0.04] bg-[#e08a8a]/[0.06] px-5 py-3 text-[12px] text-[#e08a8a]">
            Notifications are blocked for this site in your browser. Turn them back on in your browser's
            site settings (the lock icon in the address bar) — apps can't do it for you. In-app alerts in
            the bell still work.
          </p>
        )}
        <Toggle prefKey="tradeableAlerts" label="Tradeable alerts" hint="Notify when a market clears every gate." />
        <Toggle prefKey="expiryWarnings" label="Expiry warnings" hint="Warn when a market is under a minute from expiry." />
          </>
        )}
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
  const { displayName, avatar, setDisplayName, setAvatar } = useProfile();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = wallet.address ? wallet.address.slice(2, 4).toUpperCase() : "—";

  function copy() {
    if (!wallet.address) return;
    navigator.clipboard?.writeText(wallet.address).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }, () => undefined);
  }

  function saveName() {
    setDisplayName(name.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setUploadError("Choose an image file.");
    if (file.size > 5 * 1024 * 1024) return setUploadError("Image must be under 5 MB.");
    setUploadError(null);
    try {
      setAvatar(await fileToAvatar(file));
    } catch {
      setUploadError("Could not read that image.");
    }
  }

  return (
    <div className={cn(PANEL, "p-5")}>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <ProfileAvatar
            fallback={initials}
            showImage={wallet.ready}
            className={cn(
              "h-20 w-20 rounded-2xl text-[24px] font-bold",
              wallet.ready ? "bg-gradient-to-br from-highlighter-green to-[#12a52c] text-press-black" : "bg-white/[0.06] text-muted-sage/60"
            )}
          />
          {/* Profile editing requires a connected wallet — the identity it hangs on. */}
          {wallet.ready && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0c0f0d] bg-highlighter-green text-press-black hover:brightness-105"
                aria-label="Upload profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0c0f0d] bg-white/[0.15] text-bone-white hover:bg-white/[0.25]"
                  aria-label="Remove profile picture"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        </div>

        <div className="min-w-[220px] flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-sage/45">Display name</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              value={wallet.ready ? name : ""}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              maxLength={40}
              disabled={!wallet.ready}
              placeholder={wallet.ready ? shortAddress(wallet.address ?? "") : "Connect a wallet to set a name"}
              className="h-10 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[14px] text-bone-white placeholder:text-muted-sage/40 focus:border-white/[0.16] focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={saveName}
              disabled={!wallet.ready || name.trim() === displayName}
              className="rounded-lg bg-highlighter-green px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-press-black transition hover:brightness-105 disabled:opacity-40"
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          {uploadError && <p className="mt-1.5 text-[12px] text-[#e08a8a]">{uploadError}</p>}
          <div className="mt-2 flex items-center gap-3 text-[12px] text-muted-sage/55">
            {wallet.ready ? (
              <button onClick={copy} className="inline-flex items-center gap-1.5 hover:text-bone-white">
                {shortAddress(wallet.address ?? "")} · Somnia
                {copied ? <Check className="h-3.5 w-3.5 text-highlighter-green" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span>Not connected</span>
            )}
          </div>
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

function Toggle({ prefKey, label, hint }: { prefKey: PrefKey; label: string; hint: string }) {
  const prefs = usePrefs();
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div>
        <p className="text-[13px] font-medium text-bone-white">{label}</p>
        <p className="mt-0.5 text-[12px] text-muted-sage/55">{hint}</p>
      </div>
      <PremiumToggle defaultChecked={prefs[prefKey]} onChange={(v) => prefs.set(prefKey, v)} />
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
