import { Trophy } from "lucide-react";
import { PageHeader } from "./_shared";

/**
 * Leaderboard — ranks traders by scored-discovery performance. This needs an
 * on-chain indexer to aggregate per-address results, which isn't wired yet, so
 * it shows an honest pending state rather than fabricated standings.
 */
export function LeaderboardView() {
  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Sharpest discovery streaks on Somnia." />
      <div className="flex min-h-[46vh] items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015]">
        <div className="max-w-md p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03]">
            <Trophy className="h-6 w-6 text-highlighter-green" />
          </span>
          <h2 className="mt-5 font-display text-[1.75rem] leading-none tracking-[-0.02em]">Standings go live with the indexer</h2>
          <p className="mt-3 text-[13px] text-muted-sage/60">
            Rankings are computed from per-address results aggregated by the Somnia indexer. Once that
            service is connected, the leaderboard populates from real on-chain activity.
          </p>
        </div>
      </div>
    </div>
  );
}
