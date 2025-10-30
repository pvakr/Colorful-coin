"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    setMessage("Hint: Place the lightest color first and the darkest last.");
  }

  return (
    <main className="min-h-screen p-6 relative">
      {/* Back Button */}
      <div className="fixed top-4 left-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
          onClick={() => router.push("/games")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Color Sort</h1>
          <p className="text-sm opacity-70">Round {round}</p>
        </header>

        <p className="mb-4 font-medium">{message}</p>

        {/* Track with slots */}
        <div className="space-y-3">
          {items.map((s, idx) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border bg-white/70 p-3 select-none ${
                isChecking && correctOrder[idx] === s.id
                  ? "ring-2 ring-green-300"
                  : ""
              }`}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
              role="listitem"
              aria-label={`Swatch ${idx + 1}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") moveItem(idx, -1);
                if (e.key === "ArrowDown") moveItem(idx, 1);
              }}
            >
              <div
                className="h-10 w-10 rounded-lg border"
                style={{ background: s.hex }}
                aria-hidden
              />
              <div className="flex-1">
                <div className="text-sm font-mono">{s.hex.toUpperCase()}</div>
                <div className="text-xs opacity-60">
                  Luminance: {s.lum.toFixed(4)}
                </div>
              </div>
              <div className="cursor-grab text-xs opacity-60">↕ drag</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={checkOrder}
            className="rounded-xl border px-4 py-2 bg-white hover:bg-white/80 font-medium"
          >
            Check Order
          </button>
          <button
            onClick={() => setRound((r) => r + 1)}
            className="rounded-xl border px-4 py-2 bg-white hover:bg-white/80"
          >
            New Round
          </button>
          <button
            onClick={revealHint}
            className="rounded-xl border px-4 py-2 bg-white hover:bg-white/80 text-sm"
          >
            Hint
          </button>

          {lastScore !== null && (
            <span
              className={`ml-auto rounded-xl px-3 py-1 text-sm ${
                lastScore === 100
                  ? "bg-green-100 border border-green-200"
                  : lastScore >= 70
                  ? "bg-yellow-100 border border-yellow-200"
                  : "bg-red-100 border border-red-200"
              }`}
            >
              Accuracy: {lastScore}%
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 rounded-xl border bg-white/60 p-3 text-sm">
          <div className="font-medium mb-1">How to play</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Drag the color rows to sort from <b>lightest → darkest</b>.
            </li>
            <li>Use ↑ / ↓ arrow keys to reorder with the keyboard.</li>
            <li>Press <b>Check Order</b> to see your accuracy.</li>
            <li>Start a <b>New Round</b> for a fresh set of colors.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
