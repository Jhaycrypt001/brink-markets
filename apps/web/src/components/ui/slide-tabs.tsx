import { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type SlideTab = {
  id: string;
  label: string;
  href: string;
};

type SlideTabsProps = {
  tabs: SlideTab[];
  className?: string;
};

type CursorPosition = {
  left: number;
  width: number;
  opacity: number;
};

export function SlideTabs({ tabs, className }: SlideTabsProps) {
  const [selected, setSelected] = useState(0);
  const [position, setPosition] = useState<CursorPosition>({
    left: 0,
    width: 0,
    opacity: 0
  });
  const tabsRef = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const selectedTab = tabsRef.current[selected];
    if (!selectedTab) return;

    setPosition({
      left: selectedTab.offsetLeft,
      width: selectedTab.getBoundingClientRect().width,
      opacity: 1
    });
  }, [selected]);

  return (
    <ul
      aria-label="Sections"
      onMouseLeave={() => {
        const selectedTab = tabsRef.current[selected];
        if (!selectedTab) return;

        setPosition({
          left: selectedTab.offsetLeft,
          width: selectedTab.getBoundingClientRect().width,
          opacity: 1
        });
      }}
      className={cn(
        "relative mx-auto flex w-fit items-center rounded-full border border-press-black bg-bone-white p-1",
        className
      )}
    >
      {tabs.map((tab, index) => (
        <Tab
          key={tab.id}
          ref={(element) => {
            tabsRef.current[index] = element;
          }}
          href={tab.href}
          onSelect={() => setSelected(index)}
        >
          {tab.label}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
}

type TabProps = {
  children: string;
  href: string;
  onSelect: () => void;
};

const Tab = forwardRef<HTMLLIElement, TabProps>(function Tab(
  { children, href, onSelect },
  ref
) {
  return (
    <li ref={ref} className="relative z-10 block">
      <a
        href={href}
        onClick={onSelect}
        className="relative z-10 block cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.11px] text-white mix-blend-difference transition-colors hover:text-white md:px-4 md:py-2 md:text-[13px]"
      >
        {children}
      </a>
    </li>
  );
});

function Cursor({ position }: { position: CursorPosition }) {
  return (
    <motion.li
      aria-hidden="true"
      animate={position}
      className="absolute bottom-1 left-0 top-1 z-0 rounded-full bg-press-black"
    />
  );
}
