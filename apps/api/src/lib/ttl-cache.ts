export class TtlCache<T> {
  private value?: T;
  private expiresAt = 0;
  private inFlight?: Promise<T>;

  public constructor(private readonly ttlMs: number, private readonly staleMs = 0) {}

  public async getOrSet(loader: () => Promise<T>): Promise<T> {
    if (this.value !== undefined && Date.now() < this.expiresAt) return this.value;
    if (this.inFlight) return this.inFlight;

    const previous = this.value;
    const previousExpiresAt = this.expiresAt;
    this.inFlight = loader()
      .then((next) => {
        this.value = next;
        this.expiresAt = Date.now() + this.ttlMs;
        return next;
      })
      .catch((error: unknown) => {
        if (previous !== undefined && Date.now() < previousExpiresAt + this.staleMs) return previous;
        throw error;
      })
      .finally(() => {
        this.inFlight = undefined;
      });
    return this.inFlight;
  }
}
