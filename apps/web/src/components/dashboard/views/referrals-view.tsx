import { useState } from "react";
import { Copy, Check, Gift, Users, Coins } from "lucide-react";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

const CODE = "BRINK-JT7F";
const LINK = "https://brink.markets/join/BRINK-JT7F";

const REFERRED = [
  { addr: "0x2a…9f10", joined: "2d ago", earned: 42 },
  { addr: "0x5c…41bd", joined: "5d ago", earned: 31 },
  { addr: "0x88…03aa", joined: "1w ago", earned: 28 },
  { addr: "0xd1…77c2", joined: "2w ago", earned: 19 }
];

export function ReferralsView() {
  return (
    <div>
      <PageHeader title="Referrals" subtitle="Invite traders. Earn a cut of their scored discovery." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile icon={Users} label="Invited" value="12" />
        <StatTile icon={Gift} label="Active" value="8" accent />
        <StatTile icon={Coins} label="Earned" value="$120" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(PANEL, "p-5")}>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">Your code</p>
          <CopyField value={CODE} display={CODE} big />
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">Invite link</p>
          <CopyField value={LINK} display={LINK} />
          <div className="mt-5">
            <div className="flex items-center justify-between text-[12px] text-muted-sage/60">
              <span>Tier progress · Silver</span>
              <span>8 / 15 to Gold</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-highlighter-green" style={{ width: `${(8 / 15) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className={cn(PANEL, "overflow-hidden")}>
          <div className="border-b border-white/[0.06] px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">
            Referred traders
          </div>
          <div className="divide-y divide-white/[0.04]">
            {REFERRED.map((r) => (
              <div key={r.addr} className="flex items-center justify-between px-5 py-3 text-[13px]">
                <span className="tabular-nums text-bone-white">{r.addr}</span>
                <span className="text-[12px] text-muted-sage/50">{r.joined}</span>
                <span className="font-semibold tabular-nums text-highlighter-green">+${r.earned}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(PANEL, "p-4")}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-sage/45">
        <Icon className={cn("h-4 w-4", accent ? "text-highlighter-green" : "text-muted-sage/50")} /> {label}
      </div>
      <p className={cn("mt-2 font-display text-[2rem] leading-none", accent ? "text-highlighter-green" : "text-bone-white")}>{value}</p>
    </div>
  );
}

function CopyField({ value, display, big }: { value: string; display: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }, () => undefined);
  }
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
      <span className={cn("min-w-0 flex-1 truncate text-bone-white", big ? "font-display text-[1.5rem] tracking-[-0.02em]" : "text-[13px]")}>
        {display}
      </span>
      <button onClick={copy} className="shrink-0 rounded-md p-1.5 text-muted-sage/60 hover:text-bone-white" aria-label="Copy">
        {copied ? <Check className="h-4 w-4 text-highlighter-green" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
