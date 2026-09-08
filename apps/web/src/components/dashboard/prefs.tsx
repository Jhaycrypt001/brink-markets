import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";

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
  playTick: () => void;
};

const Ctx = createContext<PrefsContext | null>(null);

export function usePrefs(): PrefsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs must be used within PreferencesProvider");
  return ctx;
}

function read(): Prefs {
  const out = { ...DEFAULTS };
  try {
    for (const key of Object.keys(DEFAULTS) as PrefKey[]) {
      const v = localStorage.getItem("brink.pref." + key);
      if (v !== null) out[key] = v === "true";
    }
  } catch {
    /* ignore */
  }
  return out;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setPrefs(read());
  }, []);

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
          localStorage.setItem("brink.pref." + key, String(value));
        } catch {
          /* ignore */
        }
        return next;
      });

      if (value && key === "fillSounds") playTick();

      if (value && (key === "tradeableAlerts" || key === "expiryWarnings") && typeof Notification !== "undefined") {
        if (Notification.permission === "default") {
          void Notification.requestPermission().then(setNotifPermission);
        } else {
          setNotifPermission(Notification.permission);
        }
      }
    },
    [playTick]
  );

  const value = useMemo<PrefsContext>(
    () => ({ ...prefs, set, notifPermission, playTick }),
    [prefs, set, notifPermission, playTick]
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
