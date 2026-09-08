import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import {
  ThirdwebProvider,
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useConnectModal,
  useDisconnect,
  useSwitchActiveWalletChain
} from "thirdweb/react";

/**
 * Wallet — real wallet connection via thirdweb, gated on the Somnia Shannon
 * network. Set VITE_THIRDWEB_CLIENT_ID (see .env.example) to enable it; without
 * a client id the connect action tells the operator to configure one.
 */

const CLIENT_ID = (import.meta.env as Record<string, string | undefined>).VITE_THIRDWEB_CLIENT_ID;
const client = CLIENT_ID ? createThirdwebClient({ clientId: CLIENT_ID }) : undefined;

export const somniaShannon = defineChain({
  id: 50312,
  name: "Somnia Shannon",
  rpc: "https://dream-rpc.somnia.network",
  nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
  blockExplorers: [{ name: "Shannon Explorer", url: "https://shannon-explorer.somnia.network" }],
  testnet: true
});

type WalletState = {
  status: "disconnected" | "connected";
  network: "none" | "somnia";
  address?: string;
  ready: boolean;
  configured: boolean;
  open: () => void;
  disconnect: () => void;
};

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
  return (
    <ThirdwebProvider>
      <WalletInner>{children}</WalletInner>
    </ThirdwebProvider>
  );
}

function WalletInner({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const activeWallet = useActiveWallet();
  const { connect } = useConnectModal();
  const { disconnect } = useDisconnect();
  const switchChain = useSwitchActiveWalletChain();

  const status = account ? "connected" : "disconnected";
  const network: "none" | "somnia" = chain?.id === somniaShannon.id ? "somnia" : "none";

  const open = useCallback(() => {
    if (!client) {
      window.alert(
        "Wallet connect needs a thirdweb client id.\n\nCreate one at thirdweb.com/dashboard, then add it to apps/web/.env as:\nVITE_THIRDWEB_CLIENT_ID=your_client_id"
      );
      return;
    }
    void (async () => {
      try {
        if (!account) {
          await connect({
            client,
            chain: somniaShannon,
            chains: [somniaShannon],
            size: "compact",
            title: "Connect to Brink",
            showThirdwebBranding: false
          });
        } else if (network !== "somnia") {
          await switchChain(somniaShannon);
        }
      } catch {
        /* user closed the modal or rejected */
      }
    })();
  }, [account, network, connect, switchChain]);

  const doDisconnect = useCallback(() => {
    if (activeWallet) disconnect(activeWallet);
  }, [activeWallet, disconnect]);

  const value = useMemo<WalletState>(
    () => ({
      status,
      network,
      address: account?.address,
      ready: status === "connected" && network === "somnia",
      configured: Boolean(client),
      open,
      disconnect: doDisconnect
    }),
    [status, network, account?.address, open, doDisconnect]
  );

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}
