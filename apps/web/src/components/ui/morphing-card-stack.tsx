import { useState, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  type PanInfo
} from "framer-motion";
import { Grid3X3, Layers, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MorphingCardStack — a set of cards that morph between three layouts (stack /
 * grid / list) with a toggle, and in stack mode can be swiped or dragged to
 * cycle through. Adapted from the shadcn component to the Brink editorial tokens
 * (press-black / bone-white / highlighter-green) so it belongs to the page, and
 * tuned to be fully responsive.
 */

export type LayoutMode = "stack" | "grid" | "list";

export type CardData = {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  icon?: ReactNode;
};

type MorphingCardStackProps = {
  cards?: CardData[];
  className?: string;
  defaultLayout?: LayoutMode;
};

const layoutIcons = { stack: Layers, grid: Grid3X3, list: LayoutList } as const;
const SWIPE_THRESHOLD = 50;

export function MorphingCardStack({
  cards = [],
  className,
  defaultLayout = "stack"
}: MorphingCardStackProps) {
  const [layout, setLayout] = useState<LayoutMode>(defaultLayout);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (cards.length === 0) return null;

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;
    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }
    setIsDragging(false);
  };

  const getStackOrder = () => {
    const reordered = [];
    for (let i = 0; i < cards.length; i++) {
      const index = (activeIndex + i) % cards.length;
      reordered.push({ ...cards[index], stackPosition: i });
    }
    return reordered.reverse();
  };

  const getLayoutStyles = (stackPosition: number) => {
    if (layout === "stack") {
      return {
        top: stackPosition * 10,
        left: stackPosition * 10,
        zIndex: cards.length - stackPosition,
        rotate: (stackPosition - 1) * 2
      };
    }
    return { top: 0, left: 0, zIndex: 1, rotate: 0 };
  };

  const containerStyles = {
    stack: "relative h-72 w-full max-w-[320px]",
    grid: "grid grid-cols-1 gap-4 sm:grid-cols-2",
    list: "flex flex-col gap-4"
  } as const;

  const displayCards =
    layout === "stack"
      ? getStackOrder()
      : cards.map((c, i) => ({ ...c, stackPosition: i }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Layout toggle */}
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-press-black/15 bg-bone-white/70 p-1 backdrop-blur-md">
        {(Object.keys(layoutIcons) as LayoutMode[]).map((mode) => {
          const Icon = layoutIcons[mode];
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setLayout(mode)}
              className={cn(
                "rounded-full p-2.5 transition-all",
                layout === mode
                  ? "bg-press-black text-bone-white"
                  : "text-newsprint-gray hover:bg-press-black/5 hover:text-press-black"
              )}
              aria-label={`Switch to ${mode} layout`}
              aria-pressed={layout === mode}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <LayoutGroup>
        <motion.div layout className={cn(containerStyles[layout], "mx-auto")}>
          <AnimatePresence mode="popLayout">
            {displayCards.map((card) => {
              const styles = getLayoutStyles(card.stackPosition);
              const isExpanded = expandedCard === card.id;
              const isTopCard = layout === "stack" && card.stackPosition === 0;

              return (
                <motion.div
                  key={card.id}
                  layoutId={card.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: isExpanded ? 1.03 : 1, x: 0, ...styles }}
                  exit={{ opacity: 0, scale: 0.85, x: -200 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  drag={isTopCard ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  whileDrag={{ scale: 1.02, cursor: "grabbing" }}
                  onClick={() => {
                    if (isDragging) return;
                    setExpandedCard(isExpanded ? null : card.id);
                  }}
                  className={cn(
                    "rounded-card border border-press-black/15 bg-bone-white p-5 transition-colors hover:border-press-black/40",
                    layout === "stack" && "absolute h-72 w-full max-w-[320px]",
                    layout === "stack" && isTopCard && "cursor-grab active:cursor-grabbing",
                    layout === "grid" && "w-full",
                    layout === "list" && "w-full",
                    isExpanded && "ring-2 ring-highlighter-green"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {card.icon && (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-echo-green text-press-black">
                        {card.icon}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {card.eyebrow && (
                        <p className="eyebrow text-newsprint-gray">{card.eyebrow}</p>
                      )}
                      <h3 className="mt-1 font-display text-[1.5rem] leading-none tracking-[-0.02em] text-press-black">
                        {card.title}
                      </h3>
                      <p
                        className={cn(
                          "mt-2 text-body-sm text-newsprint-gray",
                          layout === "stack" && "line-clamp-4",
                          layout === "grid" && "line-clamp-3",
                          layout === "list" && "line-clamp-2"
                        )}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {isTopCard && (
                    <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center">
                      <span className="eyebrow text-newsprint-gray/70">
                        Swipe or drag
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {layout === "stack" && cards.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {cards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex
                  ? "w-5 bg-highlighter-green"
                  : "w-1.5 bg-press-black/25 hover:bg-press-black/40"
              )}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MorphingCardStack;
