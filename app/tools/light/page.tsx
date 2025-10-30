"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Expanded palette */
const BASE_COLORS = [
  { name: "red", hex: "#f87171" },
  { name: "orange", hex: "#fb923c" },
  { name: "amber", hex: "#f59e0b" },
  { name: "yellow", hex: "#facc15" },
  { name: "lime", hex: "#84cc16" },
  { name: "green", hex: "#4ade80" },
  { name: "teal", hex: "#14b8a6" },
  { name: "cyan", hex: "#22d3ee" },
  { name: "blue", hex: "#60a5fa" },
  { name: "indigo", hex: "#818cf8" },
  { name: "violet", hex: "#a78bfa" },
  { name: "purple", hex: "#c084fc" },
  { name: "pink", hex: "#f9a8d4" },
  { name: "brown", hex: "#92400e" },
  { name: "gray", hex: "#9ca3af" },
  { name: "black", hex: "#000000" },
  { name: "white", hex: "#ffffff", border: true },
];

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function dist(a: any, b: any) {
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
function nearestBaseColor(rgb: any) {
  return BASE_COLORS.reduce(
    (best, c) => {
      const d = dist(rgb, hexToRgb(c.hex));
      return d < best.d ? { c, d } : best;
    },
    { c: BASE_COLORS[0], d: Infinity }
  ).c;
}
function rgbToHexStr(rgb: string) {
  // 👇 correct regex (no extra backslashes)
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return "#ffffff";
  const [r, g, b] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  return (
    "#" +
    [r, g, b]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  );
}


/** Small badge */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/90 px-4 py-2 font-bold text-slate-800 shadow ring-1 ring-black/5">
      {children}
    </span>
  );
}

const ROUND_TIME = 10000; // 10s

export default function LightPage() {
  const [base, setBase] = useState("#ffffff");
  const [mix, setMix] = useState<string[]>([]);
  const [target, setTarget] = useState(() =>
    BASE_COLORS[Math.floor(Math.random() * (BASE_COLORS.length - 2))] // avoid pure white/black as targets
  );

  const [score, setScore] = useState(0);
  const [roundKey, setRoundKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [paused, setPaused] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);

  // Compute mixed color
  function mixedCss() {
    const all = [base, ...mix];
    const rgbs = all.map(hexToRgb);
    const r = Math.round(rgbs.reduce((s, v) => s + v.r, 0) / rgbs.length);
    const g = Math.round(rgbs.reduce((s, v) => s + v.g, 0) / rgbs.length);
    const b = Math.round(rgbs.reduce((s, v) => s + v.b, 0) / rgbs.length);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const achieved =
    nearestBaseColor(hexToRgb(rgbToHexStr(mixedCss()))).name === target.name;

  // Watch for success
  useEffect(() => {
    if (!paused && achieved) {
      setPaused(true);
      setScore((s) => s + 1);
      setShowSuccess(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achieved]);

  // Timer (smooth countdown)
  useEffect(() => {
    if (paused) return;
    let start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      const elapsed = t - start;
      const remaining = Math.max(0, ROUND_TIME - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setPaused(true);
        setShowTimeout(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    setTimeLeft(ROUND_TIME);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [roundKey, paused]);

  function newRound() {
    setBase("#ffffff");
    setMix([]);
    setTarget(
  BASE_COLORS.filter(c => c.name !== "white" && c.name !== "black")[
    Math.floor(Math.random() * (BASE_COLORS.length - 2))
  ]
);

    setPaused(false);
    setRoundKey((k) => k + 1);
  }

  const timePct = Math.max(0, Math.min(100, (timeLeft / ROUND_TIME) * 100));

  return (
    <main className="relative z-10 min-h-screen p-6">{/* ← no opaque bg, sits above global bg */}
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">💡 Light Puzzle</h1>
          <div className="flex items-center gap-3">
            <Badge>🏆 Score: {score}</Badge>
            <Badge>⏱️ {(Math.ceil(timeLeft / 100) / 10).toFixed(1)}s</Badge>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/50 shadow-inner ring-1 ring-black/5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-lime-400"
            initial={{ width: "100%" }}
            animate={{ width: `${timePct}%` }}
            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Controls */}
          <div className="rounded-3xl bg-white/80 backdrop-blur p-5 shadow-xl space-y-4">
            <div className="font-semibold text-slate-700">Start Light</div>
            <input
              type="color"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="h-12 w-full rounded-xl border"
            />

            <div className="mt-2 font-semibold text-slate-700">Add Filters</div>
            <div className="flex flex-wrap gap-2">
              {BASE_COLORS.filter((c) => c.name !== "white" && c.name !== "black").map((c) => {
                const active = mix.includes(c.hex);
                return (
                  <motion.button
                    key={c.name}
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={() =>
                      setMix((m) => (active ? m.filter((x) => x !== c.hex) : [...m, c.hex]))
                    }
                    className={`rounded-xl px-3 py-2 text-sm shadow transition ${
                      active ? "ring-2 ring-slate-900" : ""
                    }`}
                    style={{
                      backgroundColor: c.hex,
                      color: ["yellow", "white", "lime"].includes(c.name) ? "#111827" : "#fff",
                    }}
                  >
                    {active ? "− " : "+ "}
                    <span className="capitalize">{c.name}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setBase("#ffffff");
                  setMix([]);
                }}
                className="rounded-xl bg-slate-800 px-4 py-2 text-white shadow"
              >
                ♻️ Reset
              </button>
              <button
                onClick={newRound}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white shadow"
              >
                🎯 New Target
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-3xl bg-white/80 backdrop-blur p-5 shadow-xl space-y-4">
            <div className="text-sm font-semibold text-slate-600">Your Mix</div>
            <div
              className="h-48 w-full rounded-2xl border shadow-inner"
              style={{ backgroundColor: mixedCss() }}
            />
            <div className="text-sm font-semibold text-slate-600">Target</div>
            <div
              className="h-16 w-full rounded-2xl border shadow-inner"
              style={{ backgroundColor: target.hex }}
            />
            {achieved && !paused && (
              <div className="rounded-xl bg-emerald-100 px-4 py-2 text-emerald-800 font-semibold">
                ✅ Matched <span className="capitalize">{target.name}</span>!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal open={showSuccess} onClose={() => {}}>
        <div className="text-center space-y-3">
          <div className="text-4xl">🎉</div>
          <h2 className="text-2xl font-extrabold text-emerald-700">Congrats!</h2>
          <p className="text-slate-700">You matched the target. +1 score!</p>
          <button
            onClick={() => {
              setShowSuccess(false);
              newRound();
            }}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </Modal>

      {/* Timeout Modal */}
      <Modal open={showTimeout} onClose={() => {}}>
        <div className="text-center space-y-3">
          <div className="text-4xl">⏰</div>
          <h2 className="text-2xl font-extrabold text-rose-700">Time&apos;s up!</h2>
          <p className="text-slate-700">Please try again.</p>
          <button
            onClick={() => {
              setShowTimeout(false);
              newRound();
            }}
            className="rounded-xl bg-rose-600 px-5 py-3 text-white shadow hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </Modal>
    </main>
  );
}

/** Simple modal */
function Modal({
  open,
  children,
  onClose,
}: {
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
