/**
 * Closing signature. The design system's final move: a full-bleed accent band
 * under the dark footer, carrying the wordmark at display scale and nothing
 * else. It is the one place the accent covers real area — which is exactly why
 * no section above it is allowed to.
 *
 * Not a link and not a heading: it is a colophon, so it is marked aria-hidden
 * and the word is set as decoration rather than repeated to screen readers.
 */
export function AccentBand() {
  return (
    <section
      className="bg-highlighter-green text-typesetter-ink"
      aria-label="Brink"
    >
      <div className="page-shell">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-typesetter-ink/20 py-6">
          <span className="micro-label">Market discovery · DreamDEX</span>
          <span className="micro-label">Somnia Shannon · read-only</span>
          <span className="micro-label hidden sm:inline">Est. 2026</span>
        </div>

        {/* Clipped at the baseline so the letterforms bleed off the page edge
            the way a press mark would. The leading is inline rather than a
            `leading-*` utility because `text-display` carries its own
            line-height sub-property and utility ordering between the two is not
            worth depending on. */}
        <div aria-hidden="true" className="overflow-hidden">
          <p
            className="display-type -mb-[0.14em] mt-6 text-display"
            style={{ lineHeight: 0.78 }}
          >
            Brink
          </p>
        </div>
      </div>
    </section>
  );
}
