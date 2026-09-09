import { type ReactNode } from "react";
import { Plug, ShieldCheck } from "lucide-react";
import { useWallet } from "@/components/dashboard/wallet";
import { GlassButton } from "@/components/ui/glass-button";

/**
 * RequireWallet — gates a section behind a connected wallet on Somnia. Until the
 * wallet is ready it shows a "connect to continue" card; once ready it renders
 * the section. This is the product's read-nothing-until-connected rule.
 */
export function RequireWallet({ title, children }: { title: string; children: ReactNode }) {
  const wallet = useWallet();

  if (wallet.ready) return <>{children}</>;

  const needsNetwork = wallet.status === "connected";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-highlighter-green">
          Wallet required
        </p>
        <h2 className="mt-3 font-display text-[1.9rem] leading-none tracking-[-0.02em] text-bone-white">
          {needsNetwork ? "Switch to Somnia to continue" : "Connect a wallet to continue"}
        </h2>
        <p className="mt-4 max-w-md text-[13px] leading-relaxed text-muted-sage/60">
          {needsNetwork
            ? `${title} reads and writes on Somnia Shannon. Switch your wallet's network to continue.`
            : `Every figure on ${title} is either your own balance or a write signed by your address. There's nothing to show until a wallet is connected.`}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <GlassButton tone="green" size="lg" onClick={wallet.open}>
            {needsNetwork ? <ShieldCheck className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
            {needsNetwork ? "Switch network" : "Connect wallet"}
          </GlassButton>
          <a href="/docs" className="text-[13px] text-muted-sage/70 underline underline-offset-4 hover:text-bone-white">
            Full walkthrough
          </a>
        </div>
      </div>
    </div>
  );
}
