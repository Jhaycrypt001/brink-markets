import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  name: string;
  /** Section anchors contain "#" (e.g. "/#markets"); routes do not (e.g. "/docs"). */
  url: string;
  icon: LucideIcon;
};

type NavBarProps = {
  items: NavItem[];
  className?: string;
};

/**
 * Tubelight navbar — a pill of links with a green "lamp" that slides to the
 * active item. Adapted for this Vite + React app: section links (containing a
 * "#") render as anchors and are tracked by a scroll spy on the landing page;
 * route links (like "/docs") render as router <Link>s and are active by path,
 * taking the reader to a separate page entirely.
 */
export function NavBar({ items, className }: NavBarProps) {
  const location = useLocation();
  const isOnLanding = location.pathname === "/";
  const [activeSection, setActiveSection] = useState(
    items.find((item) => item.url.includes("#"))?.name ?? ""
  );

  useEffect(() => {
    if (!isOnLanding) return;

    const sectionItems = items.filter((item) => item.url.includes("#"));
    const byId = new Map(
      sectionItems.map((item) => [item.url.split("#")[1], item.name])
    );
    const sections = [...byId.keys()]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const name = visible && byId.get(visible.target.id);
        if (name) setActiveSection(name);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items, isOnLanding]);

  const sharedClass =
    "relative cursor-pointer rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.11px] transition-colors md:px-5";

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex items-center gap-1 rounded-full border border-press-black/15 bg-bone-white/70 p-1 backdrop-blur-md",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isRoute = !item.url.includes("#");
        const isActive = isRoute
          ? location.pathname === item.url
          : isOnLanding && activeSection === item.name;

        const content = (
          <>
            <span className="hidden md:inline">{item.name}</span>
            <span className="md:hidden">
              <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
              <span className="sr-only">{item.name}</span>
            </span>
            {isActive && <Lamp />}
          </>
        );

        const classes = cn(
          sharedClass,
          isActive
            ? "text-press-black"
            : "text-newsprint-gray hover:text-press-black"
        );

        return isRoute ? (
          <Link
            key={item.name}
            to={item.url}
            aria-current={isActive ? "page" : undefined}
            className={classes}
          >
            {content}
          </Link>
        ) : (
          <a
            key={item.name}
            href={item.url}
            onClick={() => setActiveSection(item.name)}
            aria-current={isActive ? "true" : undefined}
            className={classes}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
}

function Lamp() {
  return (
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
  );
}
