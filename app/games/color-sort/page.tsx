"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- Utilities ---
type Swatch = { id: string; hex: string; lum: number };

function randHex() {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;
}

function hexToRgb(hex: string) {
  const s = hex.replace("#", "");
  const n = parseInt(s, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return { r, g, b };
}

// Perceived luminance (sRGB -> linearized)
function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = toLin(r),
    G = toLin(g),
    B = toLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Page() {
  const router = useRouter();

  const [round, setRound] = useState(1);
  const [items, setItems] = useState<Swatch[]>([]);
  const [message, setMessage] = useState<string>(
    "Drag swatches from lightest to darkest."
  );
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [showAnswerMode, setShowAnswerMode] = useState(false);
  const originalBeforeAnswerRef = useRef<Swatch[] | null>(null);
  const showAnswerTimeoutRef = useRef<number | null>(null);
  const [isAnswerOpen, setIsAnswerOpen] = useState(false);
  const [answerOrder, setAnswerOrder] = useState<Swatch[]>([]);

  // Generate a new round: 5–8 colors with good spread
  const newRound = useCallback(() => {
    setIsChecking(false);
    setLastScore(null);
    setMessage("Drag swatches from lightest to darkest.");
    const count = Math.floor(Math.random() * 4) + 5; // 5..8
    // bias: include a very light and a very dark color to make ordering clearer
    const base: string[] = [
      "#111111",
      "#eeeeee",
      ...Array.from({ length: count - 2 }, () => randHex()),
    ];
    const unique = Array.from(new Set(base)).slice(0, count);
    const swatches: Swatch[] = unique.map((hex, i) => ({
      id: `${Date.now()}-${i}`,
      hex,
      lum: luminance(hex),
    }));
    setItems(shuffle(swatches));
  }, []);

  useEffect(() => {
    newRound();
  }, [round, newRound]);

  const correctOrder = useMemo(
    () => [...items].sort((a, b) => a.lum - b.lum).map((s) => s.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((i) => i.id).join("|")] // recalc when items set changes
  );

  // --- Drag & Drop logic ---
  const dragFrom = useRef<number | null>(null);

  function onDragStart(idx: number) {
    dragFrom.current = idx;
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }
  function onDrop(idx: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === idx) return;
    setItems((list) => {
      const a = [...list];
      const [moved] = a.splice(from, 1);
      a.splice(idx, 0, moved);
      return a;
    });
  }

  // Keyboard reordering for accessibility
  function moveItem(from: number, dir: -1 | 1) {
    const to = from + dir;
    if (to < 0 || to >= items.length) return;
    setItems((list) => {
      const a = [...list];
      const [m] = a.splice(from, 1);
      a.splice(to, 0, m);
      return a;
    });
  }

  function checkOrder() {
    setIsChecking(true);
    const currentIds = items.map((s) => s.id);
    let correct = 0;
    currentIds.forEach((id, i) => {
      if (id === correctOrder[i]) correct++;
    });
    const pct = Math.round((correct / items.length) * 100);
    setLastScore(pct);
    setMessage(
      pct === 100
        ? "✅ Perfect! Nailed the order."
        : pct >= 70
        ? `👍 Good job! Accuracy: ${pct}%`
        : `😅 Keep practicing! Accuracy: ${pct}%`
    );
  }

  function revealHint() {
    // If showing answer, exit that mode first
    if (showAnswerMode) exitShowAnswer();
    setIsHintOpen(true);
  }

  function showAnswer() {
    // Show correct order in a separate box/dialog without altering the game
    if (showAnswerMode) exitShowAnswer();
    setIsChecking(false);
    setLastScore(null);
    setMessage("Drag swatches from lightest to darkest.");
    setAnswerOrder([...items].sort((a, b) => a.lum - b.lum));
    setIsAnswerOpen(true);
  }

  function exitShowAnswer() {
    if (showAnswerTimeoutRef.current) {
      clearTimeout(showAnswerTimeoutRef.current);
      showAnswerTimeoutRef.current = null;
    }
    if (originalBeforeAnswerRef.current) {
      setItems(originalBeforeAnswerRef.current);
      originalBeforeAnswerRef.current = null;
    }
    setShowAnswerMode(false);
    setIsChecking(false);
    setLastScore(null);
    setMessage("Drag swatches from lightest to darkest.");
  }

  return (
    <main className="min-h-screen p-6 relative">
      <div className="fixed top-6 left-6">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent hover:bg-transparent border px-3"
          onClick={() => router.push("/games")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Sort</h1>
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
            <span>Round</span>
            <span className="font-semibold">{round}</span>
          </span>
        </div>

        <p className="mt-4 text-center font-medium">{message}</p>

        {/* Side-by-side swatches */}
        <div
          className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          role="list"
          aria-label="Sortable color swatches"
        >
          {items.map((s, idx) => (
            <div
              key={s.id}
              className={`select-none rounded-xl border p-3 flex flex-col items-center gap-2 ${
                isChecking && correctOrder[idx] === s.id ? "ring-2 ring-green-300" : ""
              }`}
              draggable
              onDragStart={() => {
                if (showAnswerMode) exitShowAnswer();
                onDragStart(idx);
              }}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") moveItem(idx, -1);
                if (e.key === "ArrowRight") moveItem(idx, 1);
              }}
            >
              <div className="h-14 w-14 rounded-lg border" style={{ background: s.hex }} aria-label={s.hex} />
              <div className="text-xs font-mono">{s.hex.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={() => { if (showAnswerMode) exitShowAnswer(); checkOrder(); }} className="rounded-xl border px-4 py-2">
            Check Order
          </button>
          <button onClick={() => { if (showAnswerMode) exitShowAnswer(); setRound((r) => r + 1); }} className="rounded-xl border px-4 py-2">
            New Round
          </button>
          <button onClick={revealHint} className="rounded-xl border px-4 py-2 text-sm">
            Hint
          </button>
          <button onClick={showAnswer} className="rounded-xl border px-4 py-2 text-sm">
            Show Answer
          </button>

          {lastScore !== null && (
            <span
              className={`ml-auto rounded-xl px-3 py-1 text-sm border ${
                lastScore === 100
                  ? "bg-green-50 border-green-200"
                  : lastScore >= 70
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              Accuracy: {lastScore}%
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 rounded-xl border p-3 text-sm">
          <div className="font-medium mb-1">How to play</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Drag the tiles to sort from lightest → darkest.</li>
            <li>Use ← / → arrow keys to reorder with the keyboard.</li>
            <li>Press Check Order to see your accuracy.</li>
            <li>Start a New Round for a fresh set of colors.</li>
          </ul>
        </div>
      </section>
      {/* Answer dialog (separate box) */}
      <Dialog open={isAnswerOpen} onOpenChange={setIsAnswerOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Correct Order (Light → Dark)</DialogTitle>
            <DialogDescription>
              Reference only. Your current game state remains unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {answerOrder.map((s) => (
              <div key={s.id} className="rounded-xl border p-3 flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-lg border" style={{ background: s.hex }} aria-label={s.hex} />
                <div className="text-xs font-mono">{s.hex.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button className="rounded-xl border px-4 py-2" onClick={() => setIsAnswerOpen(false)}>
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Hint dialog */}
      <Dialog open={isHintOpen} onOpenChange={setIsHintOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Hint</DialogTitle>
            <DialogDescription>
              Place tiles from lightest to darkest. Compare brightness rather than hue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <button
              className="rounded-xl border px-4 py-2"
              onClick={() => setIsHintOpen(false)}
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
