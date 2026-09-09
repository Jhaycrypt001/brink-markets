import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { useActiveAccount } from "thirdweb/react";

/**
 * Preferences — the real settings engine. Each preference drives actual
 * behavior, not just stored state:
 *  - compactDensity: scales the terminal down (zoom) for denser layout
 *  - reduceMotion: forces framer-motion to reduce, app-wide (MotionConfig)
 *  - fillSounds: plays a WebAudio tick when a market turns tradeable
 *  - tradeableAlerts / expiryWarnings: fire real browser notifications
 * Values persist to localStorage; notification prefs request permission.
 */

export type PrefKey = "compactDensity" | "reduceMotion" | "fillSounds" | "tradeableAlerts" | "expiryWarnings";

type Prefs = Record<PrefKey, boolean>;

const DEFAULTS: Prefs = {
  compactDensity: false,
  reduceMotion: false,
  fillSounds: false,
  tradeableAlerts: true,
  expiryWarnings: true
};

type PrefsContext = Prefs & {
  set: (key: PrefKey, value: boolean) => void;
  notifPermission: NotificationPermission | "unsupported";
  requestNotifPermission: () => void;
  playTick: () => void;
};

const Ctx = createContext<PrefsContext | null>(null);

export function usePrefs(): PrefsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs must be used within PreferencesProvider");
  return ctx;
}

// Preferences are scoped to the connected wallet, so each address keeps its own
// alert and display settings. Before any wallet connects they fall back to a
// shared "guest" scope.
function scopeKey(address: string | null, key: PrefKey): string {
  return `brink.pref.${address ?? "guest"}.${key}`;
}

function read(address: string | null): Prefs {
  const out = { ...DEFAULTS };
  try {
    for (const key of Object.keys(DEFAULTS) as PrefKey[]) {
      const v = localStorage.getItem(scopeKey(address, key));
      if (v !== null) out[key] = v === "true";
    }
  } catch {
    /* ignore */
  }
  return out;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const address = account?.address ? account.address.toLowerCase() : null;

  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const audioRef = useRef<AudioContext | null>(null);

  // Reload the right preference set whenever the connected wallet changes.
  useEffect(() => {
    setPrefs(read(address));
  }, [address]);

  const playTick = useCallback(() => {
    try {
      if (!audioRef.current) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = new Ctor();
      }
      const ctx = audioRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      /* audio not available */
    }
  }, []);

  const set = useCallback(
    (key: PrefKey, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(scopeKey(address, key), String(value));
        } catch {
          /* ignore */
        }
        return next;
      });

      if (value && key === "fillSounds") playTick();

      // Turning a notification pref ON is a user gesture, so it's the moment to
      // ask the browser for permission (Brave/Chrome show the Allow prompt) and
      // to confirm visibly when it's already granted.
      if (value && (key === "tradeableAlerts" || key === "expiryWarnings") && typeof Notification !== "undefined") {
        const confirm = (p: NotificationPermission) => {
          setNotifPermission(p);
          if (p === "granted") notify("Notifications on", "Brink will alert you here and on your desktop.");
        };
        if (Notification.permission === "default") {
          void Notification.requestPermission().then(confirm);
        } else {
          confirm(Notification.permission);
        }
      }
    },
    [playTick, address]
  );

  const requestNotifPermission = useCallback(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      void Notification.requestPermission().then(setNotifPermission);
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const value = useMemo<PrefsContext>(
    () => ({ ...prefs, set, notifPermission, requestNotifPermission, playTick }),
    [prefs, set, notifPermission, requestNotifPermission, playTick]
  );

  return (
    <Ctx.Provider value={value}>
      <MotionConfig reducedMotion={prefs.reduceMotion ? "always" : "user"}>{children}</MotionConfig>
    </Ctx.Provider>
  );
}

/** Fire a browser notification if permission is granted. */
export function notify(title: string, body: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      // eslint-disable-next-line no-new
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  } catch {
    /* ignore */
  }
}
