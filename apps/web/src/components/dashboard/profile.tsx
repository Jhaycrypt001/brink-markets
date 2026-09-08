import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Profile — the user's editable display name and avatar (stored as a data URL).
 * Persisted per-browser in localStorage. The wallet address is the identity;
 * this is the human-facing presentation layer on top of it.
 */

type ProfileCtx = {
  displayName: string;
  avatar: string | null;
  setDisplayName: (name: string) => void;
  setAvatar: (dataUrl: string | null) => void;
};

const NAME_KEY = "brink.profile.name";
const AVATAR_KEY = "brink.profile.avatar";
const Ctx = createContext<ProfileCtx | null>(null);

export function useProfile(): ProfileCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [displayName, setName] = useState("");
  const [avatar, setAv] = useState<string | null>(null);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
      setAv(localStorage.getItem(AVATAR_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const setDisplayName = useCallback((name: string) => {
    setName(name);
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      /* ignore */
    }
  }, []);

  const setAvatar = useCallback((dataUrl: string | null) => {
    setAv(dataUrl);
    try {
      if (dataUrl) localStorage.setItem(AVATAR_KEY, dataUrl);
      else localStorage.removeItem(AVATAR_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ProfileCtx>(
    () => ({ displayName, avatar, setDisplayName, setAvatar }),
    [displayName, avatar, setDisplayName, setAvatar]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Avatar box: shows the uploaded picture, else the fallback initials. Caller
 *  styles size/shape/background via className. */
export function ProfileAvatar({ fallback, className }: { fallback: string; className?: string }) {
  const { avatar } = useProfile();
  return (
    <span className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      {avatar ? (
        <img src={avatar} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        fallback
      )}
    </span>
  );
}

/** Read an image File into a downscaled square data URL (<=256px) for storage. */
export function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
