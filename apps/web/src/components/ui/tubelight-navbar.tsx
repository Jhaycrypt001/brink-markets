import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  name: string;
  url: string;
  icon: LucideIcon;
};

type NavBarProps = {
  items: NavItem[];
  className?: string;
};

/**
 * Tubelight navbar — a pill of section links with a green "lamp" that slides to
 * the active tab. Adapted from the shadcn component for this Vite + React app:
 * the Next.js <Link> is a plain anchor, colors are mapped to the Brink editorial
 * tokens, and the active tab is driven by a scroll spy so the lamp tracks the
 * section the reader is actually looking at (not just the last one clicked).
 */
export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0]?.name ?? "");

  useEffect(() => {
    const sectionIds = items
      .map((item) => (item.url.startsWith("#") ? item.url.slice(1) : null))
      .filter((id): id is string => Boolean(id));

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const byId = new Map(items.map((item) => [item.url.slice(1), item.name]));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const name = visible && byId.get(visible.target.id);
        if (name) setActiveTab(name);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "flex items-center gap-1 rounded-full border border-press-black/15 bg-bone-white/70 p-1 backdrop-blur-md",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.name;

        return (
          <a
            key={item.name}
            href={item.url}
            onClick={() => setActiveTab(item.name)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative cursor-pointer rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.11px] transition-colors md:px-5",
              "text-newsprint-gray hover:text-press-black",
              isActive && "text-press-black"
            )}
          >
            <span className="hidden md:inline">{item.name}</span>
            <span className="md:hidden">
              <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
              <span className="sr-only">{item.name}</span>
            </span>

            {isActive && (
              <motion.span
                layoutId="tubelight"
                className="absolute inset-0 -z-10 rounded-full bg-highlighter-green/15"
                initial={false}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
              >
                <span className="absolute -top-[3px] left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-highlighter-green">
                  <span className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-highlighter-green/25 blur-md" />
                  <span className="absolute -top-1 h-6 w-8 rounded-full bg-highlighter-green/20 blur-md" />
                  <span className="absolute left-2 top-0 h-4 w-4 rounded-full bg-highlighter-green/20 blur-sm" />
                </span>
              </motion.span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
