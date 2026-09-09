import { createHash } from "node:crypto";

/**
 * ReferralStore — a real referral engine (no fabricated numbers).
 *
 * Every wallet gets a deterministic, collision-resistant code derived from its
 * address, a shareable identity that never changes. When a new wallet arrives
 * with someone's code we record the attribution once and credit the referrer.
 * Reads return live counts.
 *
 * State is in-process: it is real and consistent for a running server, and it
 * resets if the process restarts. Production should back this with a database;
 * the surface here (stats/claim) is exactly what a persistent store would
 * implement, so swapping the backing map for a DB is a drop-in change.
 */

// Crockford-ish alphabet: no 0/O/1/I to keep codes unambiguous when shared.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 8;

export type ReferralStats = {
  address: string;
  code: string;
  /** How many distinct wallets have joined using this address's code. */
  referred: number;
  /** The code owner who referred this address, if any. */
  referredBy: string | null;
  joinedAt: number;
};

export type ClaimResult = {
  ok: boolean;
  referrer: string | null;
  reason?: "self" | "already-claimed" | "unknown-code";
};

export class ReferralStore {
  private readonly codeToAddress = new Map<string, string>();
  private readonly referredBy = new Map<string, string>();
  private readonly referredCount = new Map<string, number>();
  private readonly joinedAt = new Map<string, number>();

  public codeFor(address: string): string {
    const digest = createHash("sha256").update(address.toLowerCase()).digest();
    let code = "";
    for (let i = 0; i < CODE_LEN; i += 1) code += ALPHABET[digest[i] % ALPHABET.length];
    return code;
  }

  private register(address: string): string {
    const addr = address.toLowerCase();
    const code = this.codeFor(addr);
    this.codeToAddress.set(code, addr);
    if (!this.joinedAt.has(addr)) this.joinedAt.set(addr, Date.now());
    return code;
  }

  public stats(address: string): ReferralStats {
    const addr = address.toLowerCase();
    const code = this.register(addr);
    return {
      address: addr,
      code,
      referred: this.referredCount.get(addr) ?? 0,
      referredBy: this.referredBy.get(addr) ?? null,
      joinedAt: this.joinedAt.get(addr) ?? Date.now()
    };
  }

  public claim(address: string, code: string): ClaimResult {
    const addr = address.toLowerCase();
    this.register(addr);
    const referrer = this.codeToAddress.get(code.toUpperCase());
    if (!referrer) return { ok: false, referrer: null, reason: "unknown-code" };
    if (referrer === addr) return { ok: false, referrer: null, reason: "self" };
    const existing = this.referredBy.get(addr);
    if (existing) return { ok: false, referrer: existing, reason: "already-claimed" };
    this.referredBy.set(addr, referrer);
    this.referredCount.set(referrer, (this.referredCount.get(referrer) ?? 0) + 1);
    return { ok: true, referrer };
  }
}
