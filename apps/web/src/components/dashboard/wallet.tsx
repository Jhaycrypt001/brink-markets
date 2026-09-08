import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Wallet as WalletIcon, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wallet flow — FRONTEND ONLY (design phase). Models the intended product gate:
 * connect a wallet, then switch to the Somnia Shannon network before acting.
 * State is mocked and persisted to localStorage; swapping in a real web3
 * provider later means implementing connect()/switchNetwork() against a wallet.
 */

type Status = "disconnected" | "connected";
type Network = "none" | "somnia";

type WalletState = {
  status: Status;
  network: Network;
  address?: string;
  ready: boolean; // connected AND on Somnia
  open: () => void;
  disconnect: () => void;
};

const DEMO_ADDRESS = "0x7f42a9c3e18b6d0045f9c2ab77e1d0093c2f83ad";
const WalletCtx = createContext<WalletState | null>(null);

export function useWallet(): WalletState {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function shortAddress(addr: string): string {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("disconnected");
  const [network, setNetwork] = useState<Network>("none");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("brink.wallet.connected") === "true") {
        setStatus("connected");
        setNetwork(localStorage.getItem("brink.wallet.network") === "somnia" ? "somnia" : "none");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((s: Status, n: Network) => {
    try {
      localStorage.setItem("brink.wallet.connected", String(s === "connected"));
      localStorage.setItem("brink.wallet.network", n);
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(() => {
    setStatus("connected");
    persist("connected", network);
  }, [network, persist]);

  const switchNetwork = useCallback(() => {
    setNetwork("somnia");
    persist("connected", "somnia");
  }, [persist]);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setNetwork("none");
    persist("disconnected", "none");
  }, [persist]);

  const value = useMemo<WalletState>(
    () => ({
      status,
      network,
      address: status === "connected" ? DEMO_ADDRESS : undefined,
      ready: status === "connected" && network === "somnia",
      open: () => setModalOpen(true),
      disconnect
    }),
    [status, network, disconnect]
  );

  return (
    <WalletCtx.Provider value={value}>
      {children}
      <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={status}
        network={network}
        onConnect={connect}
        onSwitch={switchNetwork}
      />
    </WalletCtx.Provider>
  );
}

const WALLETS = [
  { id: "metamask", name: "MetaMask", glyph: "🦊" },
  { id: "walletconnect", name: "WalletConnect", glyph: "🔗" },
  { id: "coinbase", name: "Coinbase Wallet", glyph: "🔵" }
];

function ConnectModal({
  open,
  onClose,
  status,
  network,
  onConnect,
  onSwitch
}: {
  open: boolean;
  onClose: () => void;
  status: Status;
  network: Network;
  onConnect: () => void;
  onSwitch: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const step: 1 | 2 | 3 = status !== "connected" ? 1 : network !== "somnia" ? 2 : 3;

  function pickWallet(id: string) {
    setBusy(id);
    window.setTimeout(() => {
      onConnect();
      setBusy(null);
    }, 850);
  }

  function doSwitch() {
    setBusy("switch");
    window.setTimeout(() => {
      onSwitch();
      setBusy(null);
    }, 850);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#121613] p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-sage/50 hover:text-bone-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlighter-green/12 text-highlighter-green">
                <WalletIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-bone-white">
                  {step === 3 ? "You're all set" : "Connect to Brink"}
                </h2>
                <p className="text-[12px] text-muted-sage/55">Read-only until you sign.</p>
              </div>
            </div>

            {/* Steps */}
            <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
              <StepPill n={1} label="Connect" active={step === 1} done={step > 1} />
              <span className="h-px flex-1 bg-white/[0.08]" />
              <StepPill n={2} label="Somnia" active={step === 2} done={step > 2} />
            </div>

            <div className="mt-5">
              {step === 1 && (
                <div className="space-y-2">
                  {WALLETS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => pickWallet(w.id)}
                      disabled={busy !== null}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/[0.14] hover:bg-white/[0.05] disabled:opacity-60"
                    >
                      <span className="text-lg">{w.glyph}</span>
                      <span className="flex-1 text-[13px] font-semibold text-bone-white">{w.name}</span>
                      {busy === w.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-highlighter-green" />
                      ) : (
                        <span className="text-[11px] text-muted-sage/40">Detected</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-highlighter-green" />
                    <div>
                      <p className="text-[13px] font-semibold text-bone-white">Switch to Somnia Shannon</p>
                      <p className="text-[12px] text-muted-sage/55">Chain ID 50312 · testnet</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={doSwitch}
                    disabled={busy !== null}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-highlighter-green py-2.5 text-[12px] font-bold uppercase tracking-wider text-press-black transition hover:brightness-105 disabled:opacity-70"
                  >
                    {busy === "switch" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Switch network
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="rounded-xl border border-highlighter-green/20 bg-highlighter-green/[0.06] p-4 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-highlighter-green text-press-black">
                    <Check className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-[13px] font-semibold text-bone-white">Wallet connected on Somnia</p>
                  <p className="mt-1 text-[12px] text-muted-sage/55">{shortAddress(DEMO_ADDRESS)}</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] py-2.5 text-[12px] font-semibold text-bone-white hover:bg-white/[0.07]"
                  >
                    Enter terminal
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StepPill({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5",
        done ? "text-highlighter-green" : active ? "text-bone-white" : "text-muted-sage/40"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
          done ? "bg-highlighter-green text-press-black" : active ? "bg-white/[0.1] text-bone-white" : "bg-white/[0.05]"
        )}
      >
        {done ? <Check className="h-3 w-3" /> : n}
      </span>
      {label}
    </span>
  );
}
