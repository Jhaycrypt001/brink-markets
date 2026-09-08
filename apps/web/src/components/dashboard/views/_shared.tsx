import { type ReactNode } from "react";

export const PANEL = "rounded-xl border border-white/[0.06] bg-white/[0.015]";

export function PageHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-none tracking-[-0.03em] text-bone-white">
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-muted-sage/60">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
