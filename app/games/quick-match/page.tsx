"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { randomColor } from "../lib/colors";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function QuickMatch() {
  const router = useRouter();

  const [left, setLeft] = useState("#ff0000");
  const [right, setRight] = useState("#00ff00");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0); // start with 0 (no timer until Start Game clicked)
  const [started, setStarted] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

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
      setIsResultOpen(true);
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
      <div className="fixed top-6 left-6">
        <Button variant="outline" size="sm" className="bg-transparent hover:bg-transparent border px-3" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <section className="w-full max-w-3xl">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Quick Match</h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
                <span>Score</span>
                <span className="font-semibold">{score}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
                <Timer className="w-3.5 h-3.5" />
                <span>{time}s</span>
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-xl border shadow-sm" style={{ backgroundColor: left }} />
            <div className="aspect-square rounded-xl border shadow-sm" style={{ backgroundColor: right }} />
          </div>

          {started && time > 0 ? (
            <div className="mt-8 flex gap-6 justify-center">
              <Button onClick={() => answer(true)} className="bg-green-500 text-white text-xl px-10 py-4 rounded-xl hover:bg-green-600 transition">
                YES
              </Button>
              <Button onClick={() => answer(false)} className="bg-red-500 text-white text-xl px-10 py-4 rounded-xl hover:bg-red-600 transition">
                NO
              </Button>
            </div>
          ) : (
            <div className="mt-8 flex justify-center">
              <Button onClick={startGame} className="bg-white text-black hover:bg-gray-200">
                Start Game
              </Button>
            </div>
          )}

          <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">Time Up</DialogTitle>
                <DialogDescription>
                  Final Score: <span className="font-semibold">{score}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleBack}>Back to Games</Button>
                <Button onClick={startGame}>Next Round</Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>
      </main>
    </div>
  );
}
