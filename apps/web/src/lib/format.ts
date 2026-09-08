/**
 * Display formatters for market figures. Kept in one place so the feed, the
 * cards, and any future dashboard read identically.
 */

/** Event-contract prices live in 0–1 probability space; show them as cents. */
export function formatPrice(price: number | undefined): string {
  if (price === undefined || !Number.isFinite(price)) return "—";
  return `${Math.round(price * 100)}¢`;
}

/** A spread of 0.04 is 4 points of probability. */
export function formatSpread(spread: number | undefined): string {
  if (spread === undefined || !Number.isFinite(spread)) return "—";
  return `${Math.round(spread * 100)} pt`;
}

export function formatCountdown(secondsLeft: number): string {
  if (!Number.isFinite(secondsLeft) || secondsLeft <= 0) return "expired";
  const total = Math.round(secondsLeft);
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function formatVolume(volume: number): string {
  if (!Number.isFinite(volume)) return "—";
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return String(Math.round(volume));
}

export function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** "Snapshot 14:32:07" — the feed is a moment, and says so. */
export function formatSnapshotTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}
