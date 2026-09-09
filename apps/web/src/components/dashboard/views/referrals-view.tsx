import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Users, Copy, Check, Share2, Gift, UserCheck } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { fetchReferralStats, claimReferral, type ReferralStats } from "@/lib/markets";
import { shortAddress } from "@/components/dashboard/wallet";
import { pendingRef, clearPendingRef } from "@/lib/referral";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * Referrals — a real referral engine. Each connected wallet gets a live code and
 * shareable link from the API; when a new wallet arrives on that link the
 * attribution is recorded and the referrer's count goes up. Counts are live.
 */
export function ReferralsView() {
  const account = useActiveAccount();
  const address = account?.address ?? null;
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [claimed, setClaimed] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const s = await fetchReferralStats(address);
      setStats(s);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [address]);

  useEffect(() => {
    void load();
  }, [load]);

  // Redeem a pending inbound code once we know the wallet, then refresh.
  useEffect(() => {
    if (!address) return;
    const code = pendingRef();
    if (!code) return;
    void claimReferral(address, code)
      .then((res) => {
        clearPendingRef();
        if (res.ok && res.referrer) setClaimed(res.referrer);
        void load();
      })
      .catch(() => clearPendingRef());
  }, [address, load]);

  const link = stats ? `${window.location.origin}/?ref=${stats.code}` : "";

  return (
    <div>
      <PageHeader title="Referrals" subtitle="Share your link. Earn from every trader you bring on-chain." />

      {!address ? (
        <PendingState text="Connect a wallet to generate your referral code." />
      ) : state === "error" ? (
        <PendingState text="The referrals service isn't responding. Start the API and try again." />
      ) : !stats ? (
        <PendingState text="Loading your referral code…" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className={cn(PANEL, "p-6")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-sage/45">Your referral link</p>
              <ShareRow link={link} code={stats.code} />
              <p className="mt-3 text-[12px] text-muted-sage/55">
                Anyone who opens Brink with this link and connects a wallet is credited to you.
              </p>
            </div>

            {claimed && (
              <div className={cn(PANEL, "flex items-center gap-3 p-4")}>
                <UserCheck className="h-5 w-5 text-highlighter-green" />
                <p className="text-[13px] text-bone-white">
                  You joined via <span className="font-semibold">{shortAddress(claimed)}</span>. Welcome aboard.
                </p>
              </div>
            )}
            {!claimed && stats.referredBy && (
              <div className={cn(PANEL, "flex items-center gap-3 p-4")}>
                <UserCheck className="h-5 w-5 text-muted-sage/60" />
                <p className="text-[13px] text-muted-sage/70">
                  Referred by <span className="font-semibold text-bone-white">{shortAddress(stats.referredBy)}</span>.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Traders referred" value={String(stats.referred)} />
            <StatCard icon={<Gift className="h-5 w-5" />} label="Your code" value={stats.code} mono />
            <div className={cn(PANEL, "p-5 text-[12px] leading-relaxed text-muted-sage/55")}>
              Rewards accrue as your referred traders fill orders. Counts here are live — they update the
              moment someone joins on your link.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShareRow({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }, () => undefined);
  }
  async function share() {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Brink Markets", text: `Trade event contracts on Brink — join with my code ${code}`, url: link });
      } catch {
        /* cancelled */
      }
    } else {
      copy();
    }
  }
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <div className="flex min-w-0 flex-1 items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
        <span className="truncate text-[13px] text-bone-white">{link}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[12px] font-semibold text-bone-white hover:bg-white/[0.06]"
        >
          {copied ? <Check className="h-4 w-4 text-highlighter-green" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={share}
          className="inline-flex items-center gap-2 rounded-lg bg-highlighter-green px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-press-black hover:brightness-105"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, mono }: { icon: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className={cn(PANEL, "p-5")}>
      <div className="flex items-center gap-2 text-muted-sage/60">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("mt-2 font-display text-[2rem] leading-none tracking-[-0.02em] text-bone-white", mono && "tabular-nums")}>{value}</p>
    </div>
  );
}

function PendingState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[46vh] items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015]">
      <div className="max-w-md p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03]">
          <Users className="h-6 w-6 text-highlighter-green" />
        </span>
        <p className="mt-5 text-[14px] text-muted-sage/70">{text}</p>
      </div>
    </div>
  );
}
