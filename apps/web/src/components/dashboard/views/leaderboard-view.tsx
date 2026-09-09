import { useEffect, useState, type ReactNode } from "react";
import { Trophy, RefreshCw, Info } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { fetchLeaderboard, formatCompact, type LeaderEntry } from "@/lib/markets";
import { shortAddress } from "@/components/dashboard/wallet";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * Leaderboard — real standings aggregated from on-chain fills by the API's
 * /v1/leaderboard. Each trader is credited with the notional they filled across
 * live markets. Numbers are live indexer data, not demo values, so on a quiet
 * testnet the board is short — it grows as real fills land.
 */
export function LeaderboardView() {
  const account = useActiveAccount();
  const me = account?.address?.toLowerCase();
  const [rows, setRows] = useState<LeaderEntry[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    try {
      const data = await fetchLeaderboard(100);
      setRows(data);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="Real on-chain wallets, ranked by filled volume across the DreamDEX markets on Somnia."
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-muted-sage/80 hover:text-bone-white"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", state === "loading" && "animate-spin")} /> Refresh
          </button>
        }
      />

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[12px] leading-relaxed text-muted-sage/55">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-highlighter-green/70" />
        <span>
          These are real wallets trading the same on-chain DreamDEX markets Brink lists — liquidity and
          fills are shared across every front-end on Somnia, so Brink launches with real depth instead of an
          empty book. Every figure here is live indexer data.
        </span>
      </p>

      <div className={cn(PANEL, "overflow-hidden")}>
        {state === "error" ? (
          <Empty text="The leaderboard service isn't responding. Start the API and try again." />
        ) : rows === null ? (
          <Empty text="Loading standings…" />
        ) : rows.length === 0 ? (
          <Empty text="No fills on testnet yet — the board fills the moment traders start executing." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-sage/40">
                  <Th className="pl-5">#</Th>
                  <Th>Trader</Th>
                  <Th>Volume</Th>
                  <Th>Fills</Th>
                  <Th>Markets</Th>
                  <Th className="pr-5">Last active</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const mine = me === r.address.toLowerCase();
                  return (
                    <tr
                      key={r.address}
                      className={cn(
                        "border-t border-white/[0.04] text-[13px]",
                        mine ? "bg-highlighter-green/[0.07]" : "hover:bg-white/[0.02]"
                      )}
                    >
                      <td className="py-3 pl-5">
                        <Rank i={i} />
                      </td>
                      <td className="tabular-nums text-bone-white">
                        {shortAddress(r.address)}
                        {mine && <span className="ml-2 rounded bg-highlighter-green/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-highlighter-green">You</span>}
                      </td>
                      <td className="font-semibold tabular-nums text-highlighter-green">${formatCompact(r.volume)}</td>
                      <td className="tabular-nums text-muted-sage/80">{formatCompact(r.fills)}</td>
                      <td className="tabular-nums text-muted-sage/80">{r.markets}</td>
                      <td className="pr-5 tabular-nums text-muted-sage/60">{timeAgo(r.lastActive)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Rank({ i }: { i: number }) {
  const medal = ["#f4c542", "#c8d2c8", "#cd7f32"][i];
  if (medal) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-press-black"
        style={{ backgroundColor: medal }}
      >
        {i + 1}
      </span>
    );
  }
  return <span className="tabular-nums text-muted-sage/50">{i + 1}</span>;
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-2 py-2.5 font-semibold first:pl-5", className)}>{children}</th>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03]">
        <Trophy className="h-6 w-6 text-highlighter-green" />
      </span>
      <p className="max-w-sm text-[13px] text-muted-sage/60">{text}</p>
    </div>
  );
}

function timeAgo(ts: number): string {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
