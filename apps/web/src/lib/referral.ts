/**
 * Referral capture — stash an inbound ?ref=CODE the moment a visitor lands, so
 * it survives navigation and wallet-connect and can be claimed once we know
 * their address. Real attribution, no cookies beyond this one local key.
 */
const KEY = "brink.ref.pending";
const CODE_RE = /^[A-Za-z0-9]{4,16}$/;

export function captureRefFromUrl(): void {
  try {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code && CODE_RE.test(code)) localStorage.setItem(KEY, code.toUpperCase());
  } catch {
    /* ignore */
  }
}

export function pendingRef(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingRef(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
