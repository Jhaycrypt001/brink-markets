import { useState } from "react";
import { Wallet as WalletIcon, ShieldCheck, ArrowDownToLine, Copy, Check, ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletBalance } from "thirdweb/react";
import { useWallet, shortAddress, somniaShannon, thirdwebClient } from "@/components/dashboard/wallet";
import { PositionsPanel } from "@/components/dashboard/positions-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { PANEL, PageHeader } from "./_shared";
import { cn } from "@/lib/utils";

const FAUCET_URL = "https://testnet.somnia.network/";
const EXPLORER = "https://shannon-explorer.somnia.network/address/";

export function WalletView() {
  const wallet = useWallet();
  const [depositOpen, setDepositOpen] = useState(false);

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
              ? "You're connected — switch to Somnia Shannon to continue."
              : "Discovery is read-only. Connect a wallet only when you're ready to sign."}
          </p>
          <GlassButton tone="green" size="lg" onClick={wallet.open} className="mt-6">
            {wallet.status === "connected" ? "Switch network" : "Connect wallet"}
          </GlassButton>
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
          <BalanceCard address={wallet.address ?? ""} onDeposit={() => setDepositOpen(true)} />
          <PositionsPanel />
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

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} address={wallet.address ?? ""} />
    </div>
  );
}

function BalanceCard({ address, onDeposit }: { address: string; onDeposit: () => void }) {
  const { data, isLoading } = useWalletBalance({
    client: thirdwebClient!,
    chain: somniaShannon,
    address
  });

  return (
    <div className={cn(PANEL, "p-5")}>
      <p className="text-[11px] uppercase tracking-wider text-muted-sage/45">Balance</p>
      <p className="mt-2 font-display text-[3rem] leading-none tracking-[-0.03em] text-bone-white tabular-nums">
        {isLoading ? "…" : `${Number(data?.displayValue ?? 0).toFixed(4)}`}
        <span className="ml-2 text-[1.25rem] text-muted-sage/60">{data?.symbol ?? "STT"}</span>
      </p>
      <p className="mt-2 text-[13px] text-muted-sage/55">
        Live STT balance (gas). You also need testnet USDC to buy and sell — grab both from the faucet.
      </p>
      <GlassButton tone="green" onClick={onDeposit} className="mt-5">
        <ArrowDownToLine className="h-4 w-4" /> Deposit
      </GlassButton>
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
        <div className="flex items-center gap-1">
          <button onClick={copy} className="rounded-md p-1.5 text-muted-sage/60 hover:text-bone-white" aria-label="Copy address">
            {copied ? <Check className="h-4 w-4 text-highlighter-green" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={EXPLORER + address}
            target="_blank"
            rel="noreferrer"
            className="rounded-md p-1.5 text-muted-sage/60 hover:text-bone-white"
            aria-label="View on explorer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function DepositModal({ open, onClose, address }: { open: boolean; onClose: () => void; address: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(address).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }, () => undefined);
  }
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#121613] p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-muted-sage/50 hover:text-bone-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlighter-green/12 text-highlighter-green">
                <ArrowDownToLine className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-bone-white">Fund your wallet</h2>
                <p className="text-[12px] text-muted-sage/55">Somnia Shannon testnet</p>
              </div>
            </div>

            <p className="mt-5 text-[13px] leading-relaxed text-muted-sage/70">
              Trading needs two things: <span className="font-semibold text-bone-white">STT</span> for gas and
              <span className="font-semibold text-bone-white"> testnet USDC</span> as your trading balance. Claim
              both from the Somnia faucet, or send them to your address below.
            </p>

            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-sage/45">Your address</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="break-all text-[12px] tabular-nums text-bone-white">{address}</span>
                <button onClick={copy} className="shrink-0 rounded-md p-1.5 text-muted-sage/60 hover:text-bone-white" aria-label="Copy">
                  {copied ? <Check className="h-4 w-4 text-highlighter-green" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-highlighter-green py-3 text-[12px] font-bold uppercase tracking-wider text-press-black hover:brightness-105"
            >
              Open Somnia faucet <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
