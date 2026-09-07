import { ShieldCheck, Wallet, RefreshCw, Timer } from "lucide-react";

const safeguards = [
  {
    icon: ShieldCheck,
    title: "Read-only API",
    body: "Brink has no order endpoint, custody balance, or private-key path."
  },
  {
    icon: Wallet,
    title: "Wallet-signed orders",
    body: "The client verifies the chain ID and asks for confirmation before signing."
  },
  {
    icon: RefreshCw,
    title: "Fresh preflight",
    body: "A new order book and on-chain Trading state are checked immediately before an order."
  },
  {
    icon: Timer,
    title: "IOC execution",
    body: "Taker orders use IOC so an unfilled remainder does not rest unexpectedly."
  }
];

export function ExecutionSection() {
  return (
    <section id="execution" className="border-b border-press-black/15 py-20 lg:py-28">
      <div className="page-shell grid gap-14 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-20">
        <div>
          <p className="eyebrow text-newsprint-gray">Execution boundary</p>
          <h2 className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.04em] text-press-black [text-wrap:balance]">
            Discovery is automatic. Trading is not.
          </h2>
          <p className="mt-7 max-w-[520px] text-body text-slate-verdant">
            Brink narrows the feed to markets that clear the safety gates, then
            hands execution back to the wallet. Every order is explicit,
            user-signed, and based on a fresh market read.
          </p>
        </div>
        <SafeguardList />
      </div>
    </section>
  );
}

function SafeguardList() {
  return (
    <div className="divide-y divide-press-black/15 border-y border-press-black/15">
      {safeguards.map((safeguard) => (
        <div key={safeguard.title} className="flex gap-6 py-7">
          <safeguard.icon className="mt-1 h-5 w-5 shrink-0 text-press-black" aria-hidden="true" />
          <div>
            <h3 className="text-body font-medium text-press-black">{safeguard.title}</h3>
            <p className="mt-2 max-w-[540px] text-body-sm text-newsprint-gray">
              {safeguard.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
