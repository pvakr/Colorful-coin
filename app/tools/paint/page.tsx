"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { BASE_COLORS } from "../components/colors";
import ScoreBadge from "../components/ScoreBadge";

/* ---------- Reusable Back Button (inline) ---------- */
function BackButton({
  label = "Back to Tools",
  hrefFallback = "/tools",
  className = "",
}: { label?: string; hrefFallback?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = useCallback(() => {
    if (typeof window === "undefined") return router.push(hrefFallback);

    const ref = document.referrer;
    const hasHistory = window.history.length > 1;

    const sameOrigin = !!ref && (() => {
      try { return new URL(ref).origin === window.location.origin; } catch { return false; }
    })();

    const notSelf = !!ref && (() => {
      try { return new URL(ref).pathname !== pathname; } catch { return true; }
    })();

    if (hasHistory && sameOrigin && notSelf) {
      router.back();
    } else {
      router.push(hrefFallback);
    }
  }, [router, hrefFallback, pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); goBack(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack]);

  return (
    <motion.button
      onClick={goBack}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-slate-800 ring-1 ring-black/5 shadow hover:bg-white ${className}`}
      aria-label="Go back"
    >
      <span className="text-lg">←</span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  );
}

export default function PaintPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [brushColor, setBrushColor] = useState(BASE_COLORS[0].hex);
  const [brushSize, setBrushSize] = useState<number>(16); // visual radius previously; we'll use width = radius*2
  const [isErasing, setIsErasing] = useState(false);

  const [drawing, setDrawing] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);

  // Responsive, crisp canvas
  useEffect(() => {
    const c = canvasRef.current;
    const holder = containerRef.current;
    if (!c || !holder) return;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = holder.getBoundingClientRect();
      c.width = Math.max(1, Math.floor(rect.width * dpr));
      c.height = Math.max(1, Math.floor(rect.height * dpr));
      c.style.width = "100%";
      c.style.height = "100%";

      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.restore();
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(holder);
    window.addEventListener("orientationchange", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  // Map pointer to internal canvas pixels
  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = ((clientX - rect.left) / rect.width) * c.width;
    const y = ((clientY - rect.top) / rect.height) * c.height;
    return { x, y };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    setDrawing(true);
    setStrokes((s) => s + 1); // count one stroke per drag
    const p = getCanvasPoint(e);
    lastPtRef.current = p;
    drawSegment(p); // dot at start to avoid gaps
  }

  function end() {
    setDrawing(false);
    lastPtRef.current = null;
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    const p = getCanvasPoint(e);
    drawSegment(p);
  }

  function drawSegment(p: { x: number; y: number }) {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const last = lastPtRef.current ?? p;

    ctx.save();
    ctx.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize * 2; // previously radius; double for stroke width
    ctx.strokeStyle = brushColor;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();

    lastPtRef.current = p;
  }

  function clearCanvas() {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.restore();
    setStrokes(0);
  }

  const SIZES = [6, 10, 16, 24, 36, 48];

  return (
    <main className="min-h-screen p-6">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Back nav */}
          <div className="flex items-center justify-between">
            <BackButton hrefFallback="/tools" label="Back to Tools" />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-4xl font-extrabold text-slate-900">🎨 Paint Time!</h1>
            <div className="flex items-center gap-3">
              <ScoreBadge label="Strokes" value={strokes} />
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-3xl bg-white/80 p-4 shadow flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Colors */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {BASE_COLORS.map((c) => {
                const active = !isErasing && brushColor === c.hex;
                return (
                  <motion.button
                    key={c.name}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={() => { setIsErasing(false); setBrushColor(c.hex); }}
                    className={`h-12 w-12 rounded-full ring-2 ${active ? "ring-black" : "ring-transparent"}`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={`choose ${c.name}`}
                    title={c.name}
                  />
                );
              })}
            </div>

            {/* Brush sizes */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {SIZES.map((s) => {
                const active = brushSize === s && !isErasing;
                return (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={() => { setIsErasing(false); setBrushSize(s); }}
                    className={`flex items-center justify-center rounded-full bg-white shadow ring-1 ring-black/10 ${
                      active ? "ring-2 ring-slate-900" : ""
                    }`}
                    style={{ width: 44, height: 44 }}
                    aria-label={`brush size ${s}`}
                    title={`Brush ${s}px`}
                  >
                    <span
                      className="block rounded-full bg-slate-900"
                      style={{ width: Math.max(6, s / 2), height: Math.max(6, s / 2) }}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Eraser / Reset */}
            <div className="flex items-center gap-2 ml-auto">
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                onClick={() => setIsErasing((v) => !v)}
                className={`rounded-xl px-4 py-2 text-white shadow ${isErasing ? "bg-amber-600" : "bg-slate-700"}`}
              >
                {isErasing ? "🧽 Erasing…" : "🧽 Eraser"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                onClick={clearCanvas}
                className="rounded-xl bg-rose-600 px-4 py-2 text-white shadow"
              >
                ♻️ Reset
              </motion.button>
            </div>
          </div>

          {/* Big responsive canvas */}
          <div ref={containerRef} className="rounded-3xl border bg-white p-2 shadow-xl h-[70vh] w-full">
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none rounded-2xl border"
              onMouseDown={start}
              onMouseMove={draw}
              onMouseUp={end}
              onMouseLeave={end}
              onTouchStart={start}
              onTouchMove={(e) => { e.preventDefault(); draw(e); }}
              onTouchEnd={end}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
