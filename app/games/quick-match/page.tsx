"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { randomColor } from "../lib/colors";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GameWrapper from "@/components/GameWrapper";
import { Timer, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickMatch() {
  const router = useRouter();

  const [left, setLeft] = useState("#ff0000");
  const [right, setRight] = useState("#00ff00");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const difficulty = useMemo(() => Math.max(0.2, 1 - score * 0.03), [score]);

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

  const answer = (y: boolean) => {
    const correct = (left === right) === y;
    setScore((s) => s + (correct ? 1 : -1));
    nextPair();
  };

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

  const startGame = () => {
    setScore(0);
    setTime(30);
    setStarted(true);
    nextPair();
  };

  return (
    <GameWrapper
      title="Quick Match"
      description="Are the colors the same or different?"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
        { label: "Time", value: `${time}s`, icon: <Timer className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-3xl">
        <div className="mt-6 grid grid-cols-2 gap-4">
          <motion.div
            className="aspect-square rounded-xl shadow-lg"
            style={{ backgroundColor: left }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="aspect-square rounded-xl shadow-lg"
            style={{ backgroundColor: right }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        </div>

        {started && time > 0 ? (
          <div className="mt-8 flex gap-6 justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={() => answer(true)}
                className="bg-green-500 text-white text-xl px-10 py-4 rounded-xl hover:bg-green-600 transition shadow-lg"
              >
                YES
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Button
                onClick={() => answer(false)}
                className="bg-red-500 text-white text-xl px-10 py-4 rounded-xl hover:bg-red-600 transition shadow-lg"
              >
                NO
              </Button>
            </motion.div>
          </div>
        ) : (
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={startGame}
              className="bg-white text-black hover:bg-gray-200 shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          </motion.div>
        )}

        <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Timer className="w-6 h-6" />
                Time Up
              </DialogTitle>
              <DialogDescription>
                Final Score: <span className="font-semibold text-yellow-400">{score}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button onClick={startGame}>Next Round</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GameWrapper>
  );
}
