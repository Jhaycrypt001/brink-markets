import { Users } from "lucide-react";
import { PageHeader } from "./_shared";

/**
 * Referrals — invite codes and reward tracking. These are tied to an accounts
 * service that isn't wired yet, so the view shows an honest pending state rather
 * than mock codes and earnings.
 */
export function ReferralsView() {
  return (
    <div>
      <PageHeader title="Referrals" subtitle="Invite traders and earn from their scored discovery." />
      <div className="flex min-h-[46vh] items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015]">
        <div className="max-w-md p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03]">
            <Users className="h-6 w-6 text-highlighter-green" />
          </span>
          <h2 className="mt-5 font-display text-[1.75rem] leading-none tracking-[-0.02em]">Referrals open with accounts</h2>
          <p className="mt-3 text-[13px] text-muted-sage/60">
            Your referral code and reward balance are issued per connected wallet by the accounts
            service. Once it's connected, your code and stats appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
