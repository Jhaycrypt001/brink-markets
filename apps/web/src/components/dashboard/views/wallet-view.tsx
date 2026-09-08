import { Wallet as WalletIcon, ShieldCheck, ArrowDownToLine, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useWallet, shortAddress } from "@/components/dashboard/wallet";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

export function WalletView() {
  const wallet = useWallet();

  if (!wallet.ready) {
    return (
      <div>
        <PageHeader title="Wallet" subtitle="Connect and switch to Somnia to sign orders." />
        <div className={cn(PANEL, "mx-auto flex max-w-md flex-col items-center p-10 text-center")}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-highlighter-green/12 text-highlighter-green">
            {wallet.status === "connected" ? <ShieldCheck className="h-6 w-6" /> : <WalletIcon className="h-6 w-6" />}
          </span>
          <h2 className="mt-5 font-display text-[1.75rem] leading-none tracking-[-0.02em]">
            {wallet.status === "connected" ? "Switch to Somnia" : "Connect your wallet"}
          </h2>
          <p className="mt-3 text-[13px] text-muted-sage/60">
            {wallet.status === "connected"
              ? "You're connected — switch to the Somnia Shannon network to continue."
              : "Discovery is read-only. Connect a wallet only when you're ready to sign."}
          </p>
          <button
            type="button"
            onClick={wallet.open}
            className="mt-6 rounded-lg bg-highlighter-green px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-press-black transition hover:brightness-105"
          >
            {wallet.status === "connected" ? "Switch network" : "Connect wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Wallet"
        subtitle="Connected on Somnia Shannon."
        action={
          <button
            type="button"
            onClick={wallet.disconnect}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-muted-sage/80 hover:text-bone-white"
          >
            Disconnect
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className={cn(PANEL, "p-5")}>
            <p className="text-[11px] uppercase tracking-wider text-muted-sage/45">Balance</p>
            <p className="mt-2 font-display text-[3rem] leading-none tracking-[-0.03em] text-bone-white">$0.00</p>
            <p className="mt-2 text-[13px] text-muted-sage/55">0.00 USDC · fund to start signing orders.</p>
            <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-highlighter-green px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-press-black">
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </button>
          </div>

          <div className={cn(PANEL, "p-5")}>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">Open positions</p>
            <div className="mt-4 rounded-lg border border-dashed border-white/[0.1] py-8 text-center text-[13px] text-muted-sage/50">
              No open positions. Signed orders will appear here.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AddressCard address={wallet.address ?? ""} />
          <div className={cn(PANEL, "p-5")}>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">Network</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[13px] text-bone-white">Somnia Shannon</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-highlighter-green/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-highlighter-green">
                <span className="h-1.5 w-1.5 rounded-full bg-highlighter-green" /> Connected
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-sage/45">Chain ID 50312 · testnet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressCard({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(address).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }, () => undefined);
  }
  return (
    <div className={cn(PANEL, "p-5")}>
      <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-sage/70">Address</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[13px] tabular-nums text-bone-white">{shortAddress(address)}</span>
        <button onClick={copy} className="rounded-md p-1.5 text-muted-sage/60 hover:text-bone-white" aria-label="Copy address">
          {copied ? <Check className="h-4 w-4 text-highlighter-green" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
