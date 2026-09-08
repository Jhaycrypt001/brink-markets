import { Link } from "react-router-dom";
import {
  LineChart,
  LayoutGrid,
  Radar,
  Trophy,
  Wallet,
  Users,
  FileText,
  Code2,
  Bot,
  Settings,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon
} from "lucide-react";
import { BrinkMark } from "@/components/ui/brink-mark";
import { cn } from "@/lib/utils";

export type DashView =
  | "trade"
  | "markets"
  | "scanner"
  | "leaderboard"
  | "wallet"
  | "referrals"
  | "intelligence"
  | "settings";

type NavEntry = {
  view: DashView;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type NavGroup = { heading?: string; items: NavEntry[] };
type RouteEntry = { label: string; icon: LucideIcon; to: string };

const groups: NavGroup[] = [
  {
    items: [
      { view: "trade", label: "Trade", icon: LineChart },
      { view: "markets", label: "Markets", icon: LayoutGrid },
      { view: "scanner", label: "Scanner", icon: Radar },
      { view: "leaderboard", label: "Leaderboard", icon: Trophy }
    ]
  },
  {
    heading: "Account",
    items: [
      { view: "wallet", label: "Wallet", icon: Wallet },
      { view: "referrals", label: "Referrals", icon: Users }
    ]
  }
];

const resourceRoutes: RouteEntry[] = [
  { label: "Docs", icon: FileText, to: "/docs" },
  { label: "API Docs", icon: Code2, to: "/docs#endpoints" }
];

export function AppSidebar({
  view,
  onView,
  collapsed,
  onToggleCollapse
}: {
  view: DashView;
  onView: (view: DashView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-press-black">
      {/* Brand + collapse */}
      <div className={cn("flex h-16 items-center border-b border-white/[0.06]", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Link to="/" className="flex items-center gap-2.5">
          <BrinkMark className="h-6 w-6 shrink-0 text-bone-white" />
          {!collapsed && (
            <span className="font-display text-[1.3rem] leading-none tracking-[-0.04em] text-bone-white">
              Brink
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-md p-1.5 text-muted-sage/50 hover:bg-white/[0.05] hover:text-bone-white lg:block"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-2.5 py-4">
        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mb-2 hidden w-full justify-center rounded-md p-2 text-muted-sage/50 hover:bg-white/[0.05] hover:text-bone-white lg:flex"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-6" : ""}>
            {group.heading && !collapsed && (
              <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-sage/40">
                {group.heading}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavButton
                  key={item.view}
                  item={item}
                  active={view === item.view}
                  collapsed={collapsed}
                  onClick={() => onView(item.view)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Resources — external routes */}
        <div className="mt-6">
          {!collapsed && (
            <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-sage/40">
              Resources
            </p>
          )}
          <div className="space-y-1">
            {resourceRoutes.map((route) => (
              <Link
                key={route.label}
                to={route.to}
                title={collapsed ? route.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-sage/70 transition-colors hover:bg-white/[0.03] hover:text-bone-white",
                  collapsed && "justify-center"
                )}
              >
                <route.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {!collapsed && route.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Intelligence */}
        <div className="mt-6">
          {!collapsed && (
            <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-sage/40">
              Intelligence
            </p>
          )}
          <NavButton
            item={{ view: "intelligence", label: "Brink AI", icon: Bot, badge: "LIVE" }}
            active={view === "intelligence"}
            collapsed={collapsed}
            onClick={() => onView("intelligence")}
          />
        </div>
      </nav>

      {/* Profile + settings footer */}
      <div className="border-t border-white/[0.06] p-2.5">
        <button
          type="button"
          onClick={() => onView("settings")}
          className={cn(
            "mb-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-sage/70 transition-colors hover:bg-white/[0.03] hover:text-bone-white",
            view === "settings" && "bg-white/[0.06] text-bone-white",
            collapsed && "justify-center"
          )}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && "Settings"}
        </button>
        <ProfileChip collapsed={collapsed} />
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  collapsed,
  onClick
}: {
  item: NavEntry;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-white/[0.06] text-bone-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "text-muted-sage/70 hover:bg-white/[0.03] hover:text-bone-white",
        collapsed && "justify-center"
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-highlighter-green" />
      )}
      <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="rounded-full bg-highlighter-green/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-highlighter-green">
          {item.badge}
        </span>
      )}
    </button>
  );
}

function ProfileChip({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5", collapsed && "justify-center")}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-highlighter-green to-[#12a52c] text-[12px] font-bold text-press-black">
        JT
      </span>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-bone-white">Guest Trader</p>
          <p className="truncate text-[11px] text-muted-sage/50">0x7f…3ad · Shannon</p>
        </div>
      )}
    </div>
  );
}
