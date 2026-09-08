import { cn } from "@/lib/utils";

type DuotoneTileProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Rendered under the tile as a broadsheet-style credit line. */
  caption?: string;
};

/**
 * Editorial photo insert. Every photograph on the site passes through the same
 * duotone chain so the page reads as one tonal family — a full-color image
 * would not belong to the system.
 *
 * The slate-verdant backing keeps the composition honest if the asset fails to
 * load, and explicit width/height prevent layout shift as the type reflows
 * around the tile.
 */
export function DuotoneTile({
  src,
  alt,
  width,
  height,
  className,
  caption
}: DuotoneTileProps) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="overflow-hidden rounded-[14px] bg-slate-verdant">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="duotone block h-full w-full object-cover"
        />
      </div>
      {caption ? (
        <figcaption className="micro-label mt-3 text-newsprint-gray">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
