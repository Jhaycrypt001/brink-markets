import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Glass button — a translucent, green-tinted "liquid glass" control.
 *
 * The visual (blur, inner highlight, green glow) lives in globals.css under the
 * `.glass-button*` classes so the effect stays in one place; this file is just
 * the typed, variant-aware React surface. Renders as an <a> when `href` is set,
 * otherwise a <button>.
 */

const glassButtonVariants = cva(
  "glass-button relative isolate inline-flex cursor-pointer items-center justify-center rounded-full font-semibold uppercase tracking-[0.11px] transition-all",
  {
    variants: {
      size: {
        sm: "text-[10px]",
        default: "text-[11px]",
        lg: "text-[13px]",
        icon: "h-11 w-11"
      },
      tone: {
        light: "glass-button--light",
        green: "glass-button--green",
        dark: "glass-button--dark"
      }
    },
    defaultVariants: { size: "default", tone: "light" }
  }
);

const glassButtonTextVariants = cva(
  "glass-button-text relative z-10 flex select-none items-center gap-2",
  {
    variants: {
      size: {
        sm: "px-4 py-2.5",
        default: "px-6 py-3.5",
        lg: "px-8 py-4",
        icon: "h-11 w-11 items-center justify-center"
      }
    },
    defaultVariants: { size: "default" }
  }
);

type CommonProps = VariantProps<typeof glassButtonVariants> & {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; to?: undefined };

type AnchorProps = CommonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: undefined };

type RouterProps = CommonProps & { to: string; href?: undefined };

export type GlassButtonProps = ButtonProps | AnchorProps | RouterProps;

export const GlassButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  GlassButtonProps
>(function GlassButton(
  { className, children, size, tone, contentClassName, ...props },
  ref
) {
  const inner = (
    <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>
      {children}
    </span>
  );
  const shadow = <span className="glass-button-shadow" aria-hidden="true" />;
  const rootClass = cn("glass-button-wrap", glassButtonVariants({ size, tone }), className);

  if ("to" in props && props.to !== undefined) {
    const { to } = props as RouterProps;
    return (
      <Link to={to} className={rootClass} ref={ref as React.Ref<HTMLAnchorElement>}>
        {inner}
        {shadow}
      </Link>
    );
  }

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorProps } = props as AnchorProps;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={rootClass}
        {...anchorProps}
      >
        {inner}
        {shadow}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={rootClass}
      {...(props as ButtonProps)}
    >
      {inner}
      {shadow}
    </button>
  );
});

export { glassButtonVariants };
