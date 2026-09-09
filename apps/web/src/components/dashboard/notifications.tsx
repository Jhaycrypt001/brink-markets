import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useActiveAccount } from "thirdweb/react";

/**
 * In-app notifications inbox — the source for the topbar bell. The live feed
 * pushes entries here on real events (a market turning tradeable, nearing
 * expiry); the bell shows the unread count and a panel to read/clear them.
 */

export type Notice = { id: string; title: string; body: string; ts: number; read: boolean };

type NotificationsCtx = {
  notices: Notice[];
  unread: number;
  push: (title: string, body: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

const Ctx = createContext<NotificationsCtx | null>(null);

export function useNotifications(): NotificationsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const address = account?.address ?? null;
  const [notices, setNotices] = useState<Notice[]>([]);

  // The inbox belongs to the connected wallet — reset it when the account
  // changes (connect, disconnect, or switch) so alerts never bleed across.
  useEffect(() => {
    setNotices([]);
  }, [address]);

  const push = useCallback((title: string, body: string) => {
    setNotices((prev) => {
      // De-dupe: skip if the same title+body is already the newest unread entry.
      if (prev[0] && prev[0].title === title && prev[0].body === body && !prev[0].read) return prev;
      const notice: Notice = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, body, ts: Date.now(), read: false };
      return [notice, ...prev].slice(0, 50);
    });
  }, []);

  const markAllRead = useCallback(() => setNotices((prev) => prev.map((n) => ({ ...n, read: true }))), []);
  const clear = useCallback(() => setNotices([]), []);

  const value = useMemo<NotificationsCtx>(
    () => ({ notices, unread: notices.filter((n) => !n.read).length, push, markAllRead, clear }),
    [notices, push, markAllRead, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
