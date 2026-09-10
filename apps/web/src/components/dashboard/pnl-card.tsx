import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Check } from "lucide-react";
import type { Position } from "@/lib/trade";

/**
 * PnlCard — a shareable, Brink-branded P&L card (canvas-rendered, downloadable).
 * Everything on it is the position's real numbers; nothing is invented.
 */
export function PnlCardModal({ position, onClose }: { position: Position | null; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const pct =
    position && position.costBasis && position.costBasis > 0 && position.unrealizedPnl !== null
      ? (position.unrealizedPnl / position.costBasis) * 100
      : null;

  useEffect(() => {
    if (!position) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCard(canvas, position, pct);
  }, [position, pct]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `brink-${position?.outcome ?? "position"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (blob && navigator.clipboard && "write" in navigator.clipboard) {
        // eslint-disable-next-line no-undef
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* clipboard image not supported — user can still download */
    }
  }

  return (
    <AnimatePresence>
      {position && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#121613] p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-muted-sage/50 hover:text-bone-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <h2 className="mb-3 text-[15px] font-semibold text-bone-white">Share your position</h2>
            <canvas ref={canvasRef} className="w-full rounded-xl border border-white/[0.06]" />
            <div className="mt-4 flex gap-2">
              <button
                onClick={download}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-highlighter-green py-2.5 text-[12px] font-bold uppercase tracking-wider text-press-black hover:brightness-105"
              >
                <Download className="h-4 w-4" /> Download
              </button>
              <button
                onClick={copy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[12px] font-semibold text-bone-white hover:bg-white/[0.06]"
              >
                {copied ? <Check className="h-4 w-4 text-highlighter-green" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function drawCard(canvas: HTMLCanvasElement, p: Position, pct: number | null) {
  const W = 1080;
  const H = 566;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const up = (p.unrealizedPnl ?? 0) >= 0;
  const GREEN = "#2bee4b";
  const RED = "#e08a8a";
  const accent = up ? GREEN : RED;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0c0f0d");
  bg.addColorStop(1, "#121613");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Green glow
  const glow = ctx.createRadialGradient(W - 240, 120, 40, W - 240, 120, 520);
  glow.addColorStop(0, up ? "rgba(43,238,75,0.16)" : "rgba(224,138,138,0.14)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const asset = (p.marketRef.split(/[-/]/)[0] || "MARKET").toUpperCase();

  // Brink disc mark + wordmark
  ctx.save();
  ctx.translate(64, 60);
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fillStyle = GREEN;
  ctx.fill();
  ctx.fillStyle = "#0c0f0d";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.arc(16, 16, 16, -Math.PI / 2, Math.PI / 2, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#fafffa";
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  ctx.fillText("Brink", 112, 84);

  // Market + side (top right)
  ctx.textAlign = "right";
  ctx.fillStyle = "#fafffa";
  ctx.font = "700 34px Inter, system-ui, sans-serif";
  ctx.fillText(asset, W - 64, 70);
  ctx.font = "700 20px Inter, system-ui, sans-serif";
  ctx.fillStyle = accent;
  ctx.fillText(p.outcome === "YES" ? "YES" : "NO", W - 64, 100);
  ctx.textAlign = "left";

  // Big % (or $ if no pct)
  ctx.fillStyle = accent;
  ctx.font = "800 150px Inter, system-ui, sans-serif";
  const big = pct !== null ? `${up ? "+" : ""}${pct.toFixed(2)}%` : `${up ? "+" : "-"}$${Math.abs(p.unrealizedPnl ?? 0).toFixed(2)}`;
  ctx.fillText(big, 60, 320);

  // Entry / Now — show a half-cent of precision so the price matches the %
  // (whole cents print clean, fractional prices show one decimal).
  const cents = (v: number | null) => {
    if (v === null) return "—";
    const c = Math.round(v * 1000) / 10;
    return (c % 1 === 0 ? c.toFixed(0) : c.toFixed(1)) + "¢";
  };
  ctx.fillStyle = "rgba(200,210,200,0.55)";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillText("Entry", 64, 420);
  ctx.fillText("Now", 300, 420);
  ctx.fillStyle = "#fafffa";
  ctx.font = "700 34px Inter, system-ui, sans-serif";
  ctx.fillText(cents(p.avgCost), 64, 458);
  ctx.fillText(cents(p.markPrice), 300, 458);

  // Footer
  ctx.fillStyle = "rgba(200,210,200,0.5)";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillText("Brink Markets · event contracts on Somnia", 64, 520);
}
