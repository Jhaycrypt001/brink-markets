import { Trophy, Flame } from "lucide-react";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

type Trader = { rank: number; name: string; addr: string; streak: number; accuracy: number; pnl: number };

const TRADERS: Trader[] = [
  { rank: 1, name: "shannon.eth", addr: "0x9c…a12f", streak: 34, accuracy: 91, pnl: 48210 },
  { rank: 2, name: "brinkmaxi", addr: "0x41…88de", streak: 27, accuracy: 88, pnl: 39980 },
  { rank: 3, name: "0x_delta", addr: "0xbe…20aa", streak: 21, accuracy: 86, pnl: 31450 },
  { rank: 4, name: "gm_oracle", addr: "0x77…c3ad", streak: 18, accuracy: 84, pnl: 24720 },
  { rank: 5, name: "spreadhawk", addr: "0x0a…f091", streak: 15, accuracy: 82, pnl: 19860 },
  { rank: 6, name: "latency.sol", addr: "0xd2…7b45", streak: 12, accuracy: 80, pnl: 15230 },
  { rank: 7, name: "edgerunner", addr: "0x63…9e12", streak: 9, accuracy: 78, pnl: 11040 },
  { rank: 8, name: "guest_trader", addr: "0x7f…83ad", streak: 6, accuracy: 74, pnl: 6820 }
];

const medal = ["text-[#f4c869]", "text-[#c8d2c8]", "text-[#cd9b6a]"];

export function LeaderboardView() {
  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Sharpest discovery streaks on Somnia this week." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {TRADERS.slice(0, 3).map((t, i) => (
          <div key={t.rank} className={cn(PANEL, "flex items-center gap-3 p-4")}>
            <Trophy className={cn("h-7 w-7", medal[i])} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-bone-white">{t.name}</p>
              <p className="text-[11px] text-muted-sage/50">{t.addr}</p>
            </div>
            <span className="ml-auto font-display text-[1.5rem] leading-none text-highlighter-green">
              +${(t.pnl / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>

      <div className={cn(PANEL, "overflow-x-auto")}>
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-sage/40">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-2 py-3 font-semibold">Trader</th>
              <th className="px-2 py-3 font-semibold">Streak</th>
              <th className="px-2 py-3 font-semibold">Accuracy</th>
              <th className="px-4 py-3 text-right font-semibold">PnL</th>
            </tr>
          </thead>
          <tbody>
            {TRADERS.map((t) => (
              <tr key={t.rank} className={cn("border-t border-white/[0.04] text-[13px]", t.name === "guest_trader" && "bg-highlighter-green/[0.05]")}>
                <td className="px-4 py-3 font-semibold tabular-nums text-muted-sage/70">{t.rank}</td>
                <td className="px-2 py-3">
                  <span className="font-medium text-bone-white">{t.name}</span>
                  <span className="ml-2 text-[11px] text-muted-sage/45">{t.addr}</span>
                </td>
                <td className="px-2 py-3">
                  <span className="inline-flex items-center gap-1 tabular-nums text-bone-white">
                    <Flame className="h-3.5 w-3.5 text-highlighter-green" /> {t.streak}
                  </span>
                </td>
                <td className="px-2 py-3 tabular-nums text-muted-sage/80">{t.accuracy}%</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-highlighter-green">
                  +${t.pnl.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
