"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { BASE_COLORS } from "../components/colors";
import { speak } from "../components/helpers";
import ScoreBadge from "../components/ScoreBadge";

type Flash = "good" | "bad" | null;
const ROUND_TIME = 2000; // 2 seconds

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

export default function MatchPage() {
  const [target, setTarget] = useState(() => BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]);
  const [colors, setColors] = useState(() => shuffle(BASE_COLORS));
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<Flash>(null);

  // round + timer
  const [roundKey, setRoundKey] = useState(0); // bump to start a fresh timer
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [isPaused, setIsPaused] = useState(false);

  // modals
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false);

  // announce target each round
  useEffect(() => {
    speak(`Find the color ${target.name}`);
  }, [target]);

  // countdown timer
  useEffect(() => {
    if (isPaused) return;
    let start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      const elapsed = t - start;
      const remaining = Math.max(0, ROUND_TIME - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimeOut();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    setTimeLeft(ROUND_TIME);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, isPaused]);

  function startNewRound() {
    // reset everything for a new round
    setColors(shuffle(BASE_COLORS));
    setTarget(BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]);
    setFlash(null);
    setIsPaused(false);
    setRoundKey((k) => k + 1); // restart timer
  }

  function handleTimeOut() {
    setIsPaused(true);
    setShowFail(true);
    setColors((c) => shuffle(c)); // shuffle on fail/time-out
    speak("Time's up! Try again!");
  }

  function check(c: any) {
    if (showSuccess || showFail) return; // ignore clicks while modal open

    // shuffle tiles on every attempt (correct or wrong)
    setColors((prev) => shuffle(prev));

    if (c.name === target.name) {
      setScore((s) => s + 1);
      setFlash("good");
      setIsPaused(true);
      setShowSuccess(true);
      speak("Yay! Correct!");
      setTimeout(() => setFlash(null), 300);
    } else {
      setFlash("bad");
      setIsPaused(true);
      setShowFail(true);
      speak("Failed, try again!");
      setTimeout(() => setFlash(null), 250);
    }
  }

  const timePct = useMemo(() => Math.max(0, Math.min(100, (timeLeft / ROUND_TIME) * 100)), [timeLeft]);

  return (
    <main
      className={`relative z-10 min-h-screen p-6 ${flash === "good" ? "animate-pulse" : ""}`}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back nav */}
        <div className="flex items-center justify-between">
          <BackButton hrefFallback="/tools" label="Back to Tools" />
        </div>

        {/* Header: title + score + timer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
            🎯 Find <span className="capitalize">{target.name}</span>
          </h1>

          <div className="flex items-center gap-3">
            <ScoreBadge value={score} />
            {/* Timer badge */}
            <div className="rounded-full bg-white/90 px-4 py-2 font-bold text-slate-800 shadow ring-1 ring-black/5">
              ⏱️ {Math.ceil(timeLeft / 100) / 10}s
            </div>
          </div>
        </div>

        {/* Timer progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/50 shadow-inner ring-1 ring-black/5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-lime-400"
            initial={{ width: "100%" }}
            animate={{ width: `${timePct}%` }}
            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
          />
        </div>

        {/* Color grid */}
        <div className="grid grid-cols-3 gap-6">
          {colors.map((c) => (
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.06 }}
              key={c.name}
              className={`h-24 w-24 rounded-3xl shadow-xl ring-2 ring-black/5 ${flash === "bad" ? "animate-shake" : ""}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => check(c)}
              aria-label={`choose ${c.name}`}
            />
          ))}
        </div>
      </div>

      {/* Shake animation */}
      <style jsx global>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s both; }
      `}</style>

      {/* Success / Fail Modals */}
      <AnimatePresence>
        {showSuccess && (
          <Modal onClose={() => {}}>
            <div className="text-center space-y-4">
              <div className="text-3xl">🎉</div>
              <h2 className="text-2xl font-extrabold text-emerald-700">Congrats!</h2>
              <p className="text-slate-700">You got it right. +1 score!</p>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  startNewRound();
                }}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:brightness-110"
              >
                Play again
              </button>
            </div>
          </Modal>
        )}

        {showFail && (
          <Modal onClose={() => {}}>
            <div className="text-center space-y-4">
              <div className="text-3xl">😵</div>
              <h2 className="text-2xl font-extrabold text-rose-700">Oops, not quite!</h2>
              <p className="text-slate-700">Failed — try again.</p>
              <button
                onClick={() => {
                  setShowFail(false);
                  startNewRound(); // reset timer + new target + shuffle
                }}
                className="rounded-xl bg-rose-600 px-5 py-3 text-white shadow hover:brightness-110"
              >
                Try again
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
}

/** Simple animated modal */
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
