"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { BASE_COLORS } from "../components/colors";
import { speak } from "../components/helpers";
import ScoreBadge from "../components/ScoreBadge";

/** You can tune these */
const ROUND_TIME = 12000; // 12s per round
const NUM_COLORS = 8;     // colors per round

type Bucket = "warm" | "cool";
type Placement = Record<string, Bucket | null>;

const WARM_SET = new Set(["red", "orange", "yellow", "pink", "brown", "amber"]);
const COOL_SET = new Set(["blue", "green", "teal", "cyan", "indigo", "violet", "purple", "gray", "black", "white", "lime"]);

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRoundPalette() {
  // Prefer a mix of warm & cool, avoid duplicates
  const pool = BASE_COLORS.filter(c => c.name !== "white"); // white is too tricky for kids here
  return shuffle(pool).slice(0, NUM_COLORS);
}

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

export default function SortPage() {
  const [items, setItems] = useState(() => pickRoundPalette());
  const [placed, setPlaced] = useState<Placement>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Timer
  const [roundKey, setRoundKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [paused, setPaused] = useState(false);

  // UX
  const [selected, setSelected] = useState<string | null>(null); // tap-to-move
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [mistakes, setMistakes] = useState<string[]>([]);

  // Recompute correctness
  const isPlacedAll = useMemo(
    () => items.every(c => placed[c.name] === "warm" || placed[c.name] === "cool"),
    [items, placed]
  );
  const isAllCorrect = useMemo(
    () => items.every(c => (WARM_SET.has(c.name) ? placed[c.name] === "warm" : placed[c.name] === "cool")),
    [items, placed]
  );

  // Timer loop
  useEffect(() => {
    if (paused) return;
    let start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const remaining = Math.max(0, ROUND_TIME - (t - start));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        endRound(false); // time's up → fail
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    setTimeLeft(ROUND_TIME);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, paused]);

  // Auto-evaluate when everything is placed
  useEffect(() => {
    if (!paused && isPlacedAll) {
      endRound(isAllCorrect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlacedAll]);

  function endRound(success: boolean) {
    setPaused(true);
    if (success) {
      // points = number of colors this round
      setScore(s => s + items.length);
      setStreak(s => s + 1);
      speak("Great sorting!");
      setShowSuccess(true);
    } else {
      setStreak(0);
      const wrong = items
        .filter(c => (WARM_SET.has(c.name) ? placed[c.name] !== "warm" : placed[c.name] !== "cool"))
        .map(c => c.name);
      setMistakes(wrong);
      speak("Time's up, or some were wrong. Try again!");
      setShowFail(true);
    }
  }

  function newRound() {
    setItems(pickRoundPalette());
    setPlaced({});
    setSelected(null);
    setPaused(false);
    setShowSuccess(false);
    setShowFail(false);
    setMistakes([]);
    setRoundKey(k => k + 1);
  }

  function onDrop(bucket: Bucket, colorName: string) {
    setPlaced(p => ({ ...p, [colorName]: bucket }));
    setSelected(null);
  }

  function onChipClick(name: string) {
    setSelected(prev => (prev === name ? null : name));
  }

  const timePct = Math.max(0, Math.min(100, (timeLeft / ROUND_TIME) * 100));

  return (
    <main className="relative z-10 min-h-screen p-6">{/* ← no page bg; shows global bg */}
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top bar with Back */}
        <div className="flex items-center justify-between">
          <BackButton hrefFallback="/tools" label="Back to Tools" />
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
            🔥 Sort Warm vs Cool ❄️
          </h1>
          <div className="flex items-center gap-3">
            <ScoreBadge label="Score" value={score} />
            <ScoreBadge label="Streak" value={streak} />
            <span className="rounded-full bg-white/90 px-4 py-2 font-bold text-slate-800 shadow ring-1 ring-black/5">
              ⏱️ {(Math.ceil(timeLeft / 100) / 10).toFixed(1)}s
            </span>
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

        {/* Buckets */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <DropZone
            label="Warm"
            desc="“Hot” colors feel energetic (fire, sun)."
            highlight="bg-gradient-to-br from-rose-200 to-amber-100"
            accept={(c) => WARM_SET.has(c)}
            onDrop={(c: string) => onDrop("warm", c)}
            selected={selected}
            onTapAssign={() => {
              if (selected) onDrop("warm", selected);
            }}
          />
          <DropZone
            label="Cool"
            desc="“Cold” colors feel calm (ice, water, sky)."
            highlight="bg-gradient-to-br from-sky-200 to-indigo-100"
            accept={(c) => COOL_SET.has(c)}
            onDrop={(c: string) => onDrop("cool", c)}
            selected={selected}
            onTapAssign={() => {
              if (selected) onDrop("cool", selected);
            }}
          />
        </div>

        {/* Palette to sort */}
        <div className="rounded-3xl bg-white/80 p-4 shadow-xl backdrop-blur">
          <div className="mb-2 text-sm font-semibold text-slate-700">
            Drag or tap a color, then tap a bucket
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {items.map((c) => {
              const placedBucket = placed[c.name];
              return (
                <DraggableChip
                  key={c.name}
                  color={c}
                  placed={placedBucket}
                  selected={selected === c.name}
                  onClick={() => onChipClick(c.name)}
                />
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={newRound}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-white shadow"
          >
            🔁 New Round
          </button>
          {isPlacedAll && !paused && (
            <button
              onClick={() => endRound(isAllCorrect)}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow"
            >
              ✅ Check
            </button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Modal open={showSuccess} onClose={() => {}}>
        <div className="text-center space-y-3">
          <div className="text-4xl">🎉</div>
          <h2 className="text-2xl font-extrabold text-emerald-700">Great sorting!</h2>
          <p className="text-slate-700">You classified all colors correctly.</p>
          <WhyPanel items={items} />
          <button
            onClick={() => {
              setShowSuccess(false);
              newRound();
            }}
            className="mt-3 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:brightness-110"
          >
            Next round
          </button>
        </div>
      </Modal>

      {/* Fail / Timeout Modal */}
      <Modal open={showFail} onClose={() => {}}>
        <div className="text-center space-y-3">
          <div className="text-4xl">⏰</div>
          <h2 className="text-2xl font-extrabold text-rose-700">
            Time’s up (or some were wrong)
          </h2>
        {mistakes.length > 0 ? (
            <div className="text-slate-700">
              These were misplaced:{" "}
              <b>
                {mistakes
                  .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                  .join(", ")}
              </b>
            </div>
          ) : (
            <p className="text-slate-700">Give it another shot!</p>
          )}
          <WhyPanel items={items} />
          <button
            onClick={() => {
              setShowFail(false);
              newRound();
            }}
            className="mt-3 rounded-xl bg-rose-600 px-5 py-3 text-white shadow hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </Modal>
    </main>
  );
}

/** Draggable chip with placed/selected states */
function DraggableChip({
  color,
  placed,
  selected,
  onClick,
}: {
  color: { name: string; hex: string };
  placed: Bucket | null | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      draggable={!placed}
      onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("text/plain", color.name);
      }}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl px-3 py-2 shadow ring-1 ring-black/5 ${
        placed ? "opacity-50" : "cursor-grab active:cursor-grabbing"
      } ${selected ? "ring-2 ring-slate-900" : ""}`}
      style={{
        backgroundColor: color.hex,
        color: ["yellow", "white"].includes(color.name) ? "#111827" : "#fff",
      }}
      whileHover={{ scale: placed ? 1 : 1.06 }}
      whileTap={{ scale: 0.94 }}
      title={color.name}
    >
      <span className="text-lg">🎨</span>
      <span className="capitalize">{color.name}</span>
      {placed && <span className="text-xs opacity-80">→ {placed}</span>}
    </motion.div>

  );
}

/** Dropzone with drag & tap-to-assign */
function DropZone({
  label,
  desc,
  onDrop,
  highlight,
  accept,
  selected,
  onTapAssign,
}: {
  label: string;
  desc: string;
  onDrop: (c: string) => void;
  highlight: string;
  accept: (name: string) => boolean;
  selected: string | null;
  onTapAssign: () => void;
}) {
  const [over, setOver] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        const c = e.dataTransfer.getData("text/plain");
        if (c) {
          onDrop(c);
          setFlash(accept(c) ? "good" : "bad");
          setTimeout(() => setFlash(null), 250);
        }
        setOver(false);
      }}
      className={`rounded-3xl border-2 border-dashed p-6 shadow-xl transition ${
        over ? `ring-2 ring-blue-400 ${highlight}` : "bg-white/80"
      } ${flash === "bad" ? "animate-shake" : ""}`}
    >
      <div className="text-2xl font-bold">{label}</div>
      <div className="text-sm opacity-70">{desc}</div>

      {selected && (
        <button
          onClick={() => {
            onTapAssign();
            setFlash(accept(selected) ? "good" : "bad");
            setTimeout(() => setFlash(null), 250);
          }}
          className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white shadow"
        >
          Place selected here
        </button>
      )}

      {/* Local shake animation for wrong drops */}
      <style jsx global>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px) }
          20%, 80% { transform: translateX( 2px) }
          30%, 50%, 70% { transform: translateX(-4px) }
          40%, 60% { transform: translateX( 4px) }
        }
        .animate-shake { animation: shake 0.4s both; }
      `}</style>
    </div>
  );
}

/** Explanation panel showing the classification of all colors this round */
function WhyPanel({ items }: { items: { name: string; hex: string }[] }) {
  return (
    <div className="mt-3 text-left rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-black/5">
      <div className="font-semibold mb-2">Why warm vs cool?</div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {items.map((c) => {
          const warm = new Set(["red", "orange", "yellow"]).has(c.name); // if you have WARM_SET, use it
          return (
            <li key={c.name} className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full ring-1 ring-black/10"
                style={{ background: c.hex }}
              />
              <span className="capitalize">{c.name}</span>
              <span className={`text-xs ${warm ? "text-rose-700" : "text-sky-700"} ml-auto`}>
                {warm ? "warm (fire/sun/energy)" : "cool (water/sky/calm)"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
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
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
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
