"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import GameWrapper from "@/components/GameWrapper";
import { Trophy, Target, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

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

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = toLin(r), G = toLin(g), B = toLin(b);
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
  const [message, setMessage] = useState<string>("Drag swatches from lightest to darkest.");
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [showAnswerMode, setShowAnswerMode] = useState(false);
  const originalBeforeAnswerRef = useRef<Swatch[] | null>(null);
  const showAnswerTimeoutRef = useRef<number | null>(null);
  const [isAnswerOpen, setIsAnswerOpen] = useState(false);
  const [answerOrder, setAnswerOrder] = useState<Swatch[]>([]);

  const newRound = useCallback(() => {
    setIsChecking(false);
    setLastScore(null);
    setMessage("Drag swatches from lightest to darkest.");
    const count = Math.floor(Math.random() * 4) + 5;
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
    [items.map((i) => i.id).join("|")]
  );

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
        ? "Perfect! Nailed the order."
        : pct >= 70
        ? `Good job! Accuracy: ${pct}%`
        : `Keep practicing! Accuracy: ${pct}%`
    );
  }

  function revealHint() {
    if (showAnswerMode) exitShowAnswer();
    setIsHintOpen(true);
  }

  function showAnswer() {
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
    <GameWrapper
      title="Color Sort"
      description="Sort colors from lightest to darkest"
      stats={[
        { label: "Round", value: round, icon: <Target className="w-4 h-4" /> },
        { label: "Accuracy", value: lastScore ? `${lastScore}%` : "-", icon: <Trophy className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-4xl">
        <p className="text-center font-medium text-white mb-4">{message}</p>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          role="list"
          aria-label="Sortable color swatches"
        >
          {items.map((s, idx) => (
            <motion.div
              key={s.id}
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
              className={`select-none rounded-xl border p-3 flex flex-col items-center gap-2 bg-white/10 backdrop-blur cursor-grab active:cursor-grabbing ${
                isChecking && correctOrder[idx] === s.id ? "ring-2 ring-green-400" : ""
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="h-14 w-14 rounded-lg border shadow-lg" style={{ background: s.hex }} aria-label={s.hex} />
              <div className="text-xs font-mono text-white">{s.hex.toUpperCase()}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-6 flex flex-wrap items-center gap-3 justify-center">
          <Button onClick={() => { if (showAnswerMode) exitShowAnswer(); checkOrder(); }} className="bg-white/20 backdrop-blur hover:bg-white/30">
            Check Order
          </Button>
          <Button onClick={() => { if (showAnswerMode) exitShowAnswer(); setRound((r) => r + 1); }} className="bg-white/20 backdrop-blur hover:bg-white/30">
            New Round
          </Button>
          <Button onClick={revealHint} className="bg-white/20 backdrop-blur hover:bg-white/30">
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint
          </Button>
          <Button onClick={showAnswer} className="bg-white/20 backdrop-blur hover:bg-white/30">
            Show Answer
          </Button>
        </div>

        <Dialog open={isAnswerOpen} onOpenChange={setIsAnswerOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Correct Order (Light → Dark)</DialogTitle>
              <DialogDescription>Reference only. Your current game state remains unchanged.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {answerOrder.map((s) => (
                <div key={s.id} className="rounded-xl border p-3 flex flex-col items-center gap-2 bg-white/10">
                  <div className="h-12 w-12 rounded-lg border" style={{ background: s.hex }} aria-label={s.hex} />
                  <div className="text-xs font-mono text-white">{s.hex.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setIsAnswerOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isHintOpen} onOpenChange={setIsHintOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                Hint
              </DialogTitle>
              <DialogDescription>Place tiles from lightest to darkest. Compare brightness rather than hue.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setIsHintOpen(false)}>Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GameWrapper>
  );
}
