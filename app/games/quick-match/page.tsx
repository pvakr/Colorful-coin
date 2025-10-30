"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { randomColor } from "../lib/colors";

export default function QuickMatch() {
  const router = useRouter();

  const [left, setLeft] = useState("#ff0000");
  const [right, setRight] = useState("#00ff00");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0); // start with 0 (no timer until Start Game clicked)
  const [started, setStarted] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const difficulty = useMemo(() => Math.max(0.2, 1 - score * 0.03), [score]);

  // Generate next color pair
  const nextPair = useCallback(() => {
    const a = randomColor();
    const same = Math.random() < 0.5;
    let b = a;

    if (!same) {
      const n = (v: number) =>
        Math.max(
          0,
          Math.min(
            255,
            Math.round(v + (Math.random() * 60 + 20) * difficulty * (Math.random() < 0.5 ? -1 : 1))
          )
        );
      const r = parseInt(a.slice(1, 3), 16);
      const g = parseInt(a.slice(3, 5), 16);
      const bl = parseInt(a.slice(5, 7), 16);
      const r2 = n(r),
        g2 = n(g),
        b2 = n(bl);
      b = `#${[r2, g2, b2].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
    }

    setLeft(a);
    setRight(b);
  }, [difficulty]);

  // Answer handler
  const answer = (y: boolean) => {
    const correct = (left === right) === y;
    setScore((s) => s + (correct ? 1 : -1));
    nextPair();
  };

  // Timer effect
 useEffect(() => {
  if (started && time > 0) {
    tickRef.current = setInterval(() => setTime((t) => t - 1), 1000);
  }

  return () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };
}, [started, time]);

  useEffect(() => {
    if (time <= 0 && tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
      setStarted(false);
    }
  }, [time]);

  const handleBack = () => {
    router.push("/games");
  };

  const startGame = () => {
    setScore(0);
    setTime(30);
    setStarted(true);
    nextPair();
  };

  return (
    <div>
      {/* Back Button positioned at the top left slightly */}
      <div className="fixed top-30 left-60">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 border border-yellow text-black"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 p-8">
        <section className="mx-auto max-w-9xl rounded-3xl bg-white/85 backdrop-blur p-6 shadow-xl">
          <h1 className="text-2xl font-bold mb-3">Quick Match</h1>
          <p className="text-base opacity-70 mb-6">
            Time: {time}s · Score: {score}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-48 rounded-xl border" style={{ backgroundColor: left }} />
            <div className="h-48 rounded-xl border" style={{ backgroundColor: right }} />
          </div>

          {started && time > 0 ? (
            <div className="flex gap-6">
              <Button
                onClick={() => answer(true)}
                className="bg-green-500 text-white text-xl px-10 py-4 rounded-xl hover:bg-green-600 transition"
              >
                YES
              </Button>
              <Button
                onClick={() => answer(false)}
                className="bg-red-500 text-white text-xl px-10 py-4 rounded-xl hover:bg-red-600 transition"
              >
                NO
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="font-medium text-center text-lg">
                ⏳ Time up! Final Score: {score}
              </div>
              <Button
                onClick={startGame}
                className="bg-black text-white text-lg px-8 py-4 rounded-xl hover:bg-gray-800 transition"
              >
                Start Game
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
