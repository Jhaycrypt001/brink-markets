import { Menu, Search, Bell, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppTopbar({
  onOpenMenu,
  source,
  loading,
  onRefresh
}: {
  onOpenMenu: () => void;
  source: "live" | "demo";
  loading: boolean;
  onRefresh: () => void;
}) {
  const isLive = source === "live";
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-press-black/90 px-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-muted-sage/70 hover:bg-white/[0.05] hover:text-bone-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <label className="relative flex max-w-md flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-sage/40" />
        <input
          type="search"
          placeholder="Search markets, assets…"
          className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 text-[13px] text-bone-white placeholder:text-muted-sage/40 focus:border-white/[0.12] focus:outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex",
            isLive ? "bg-highlighter-green/12 text-highlighter-green" : "bg-white/[0.05] text-muted-sage/70"
          )}
        >
          {isLive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isLive ? "Live" : "Demo"}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-muted-sage/70 hover:text-bone-white"
          aria-label="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
        <button
          type="button"
          className="relative rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-muted-sage/70 hover:text-bone-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-highlighter-green" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-highlighter-green to-[#12a52c] text-[12px] font-bold text-press-black">
          JT
        </span>
      </div>
    </header>
  );
}
