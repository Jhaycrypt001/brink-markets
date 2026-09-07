import { ArrowUpRight, Timer, Waves, KeyRound } from "lucide-react";

const heroStats = [
  {
    label: "Expiry gate",
    value: "300s",
    detail: "Minimum time left before a market can enter the feed",
    icon: Timer
  },
  {
    label: "Book freshness",
    value: "15s",
    detail: "Maximum age for an order book used in scoring",
    icon: Waves
  },
  {
    label: "Keys held by API",
    value: "0",
    detail: "Orders stay in the user-controlled wallet",
    icon: KeyRound
  }
];

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=480&q=80",
    width: 140
  },
  {
    src: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=520&q=80",
    width: 160
  },
  {
    src: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=560&q=80",
    width: 180
  }
];

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-press-black/15">
      <div className="page-shell grid gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20 lg:py-32">
        <div className="max-w-[980px]">
          <p className="eyebrow text-newsprint-gray">
            DreamDEX event contracts · Shannon testnet
          </p>

          <h1 className="mt-7 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.05em] text-press-black [text-wrap:balance]">
            See the market before the clock runs out.
          </h1>

          <div className="mt-8 flex flex-wrap gap-3">
            {heroImages.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt=""
                width={image.width}
                height={96}
                loading={index === 0 ? "eager" : "lazy"}
                className="editorial-image h-20 w-32 rounded-card object-cover md:h-24 md:w-40"
              />
            ))}
          </div>

          <p className="mt-8 max-w-[720px] text-body text-slate-verdant [text-wrap:pretty]">
            Brink ranks live event contracts by on-chain status, fresh two-sided
            liquidity, spread, volume, and expiry headroom. It explains every
            score, then leaves the signed order where it belongs: in your wallet.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#markets"
              className="inline-flex items-center gap-2 rounded-button bg-highlighter-green px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.11px] text-typesetter-ink shadow-brink transition hover:-translate-y-0.5"
            >
              View live markets
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#scoring"
              className="inline-flex items-center rounded-pill border border-press-black px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.11px] text-press-black transition hover:bg-press-black hover:text-bone-white"
            >
              Read scoring rules
            </a>
          </div>
        </div>

        <aside className="grid content-start gap-px border border-press-black/15 bg-press-black/15 lg:mt-14">
          {heroStats.map((stat) => (
            <div key={stat.label} className="bg-bone-white p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="eyebrow text-newsprint-gray">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-press-black" aria-hidden="true" />
              </div>
              <p className="mt-5 font-display text-[3.25rem] leading-none tracking-[-0.04em] text-press-black">
                {stat.value}
              </p>
              <p className="mt-3 text-body-sm text-newsprint-gray">{stat.detail}</p>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
