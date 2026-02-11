"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Eye, Target, RotateCcw, LucideIcon } from 'lucide-react';
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import GameWrapper from "@/components/GameWrapper";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const hslToRgb = (h: number, s: number, l: number): RgbColor => {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
};

const TILE_COUNT = 5;
const SUBTLE_L_DIFFERENCE = 4;

interface ColorSet {
  baseRgb: RgbColor;
  outlierRgb: RgbColor;
  backgroundRgb: RgbColor;
  outlierIndex: number;
}

const generateColorSet = (): ColorSet => {
  const baseH = Math.floor(Math.random() * 360);
  const baseS = Math.floor(Math.random() * 30) + 50;
  let baseL = Math.floor(Math.random() * 15) + 40;

  let outlierL = baseL + (Math.random() < 0.5 ? SUBTLE_L_DIFFERENCE : -SUBTLE_L_DIFFERENCE);
  outlierL = Math.min(90, Math.max(10, outlierL));

  const baseRgb = hslToRgb(baseH, baseS, baseL);
  const outlierRgb = hslToRgb(baseH, baseS, outlierL);

  const bgH = (baseH + 180 + Math.floor(Math.random() * 60) - 30) % 360;
  const bgS = Math.floor(Math.random() * 20) + 80;
  const bgL = baseL < 50 ? 80 : 20;

  const backgroundRgb = hslToRgb(bgH, bgS, bgL);
  const outlierIndex = Math.floor(Math.random() * TILE_COUNT);

  return { baseRgb, outlierRgb, backgroundRgb, outlierIndex };
};

const initialColorSet: ColorSet = {
  baseRgb: { r: 100, g: 100, b: 100 },
  outlierRgb: { r: 120, g: 120, b: 120 },
  backgroundRgb: { r: 255, g: 255, b: 0 },
  outlierIndex: -1
};

export default function ChromaticFilter() {
  const router = useRouter()
  const handleBack = () => router.push("/games")

  const [gameState, setGameState] = useState<ColorSet>(initialColorSet);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isTileLocked, setIsTileLocked] = useState(false);

  const startNewRound = useCallback(() => {
    setGameState(generateColorSet());
    setRound(r => r + 1);
    setIsFeedbackOpen(false);
    setIsTileLocked(false);
  }, []);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const handleTileClick = (index: number) => {
    if (isTileLocked) return;
    
    setIsTileLocked(true);
    const isCorrect = index === gameState.outlierIndex;

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedbackMessage("Perfect! You ignored the illusion.");
    } else {
      setFeedbackMessage("The contrast trick got you this time.");
    }
    
    setIsFeedbackOpen(true);
  };

  const isCorrect = feedbackMessage.startsWith("Perfect");
  
  const stats: { label: string; value: string | number; icon?: React.ReactNode }[] = [
    { label: "Round", value: round, icon: <RotateCcw className="w-4 h-4" /> },
    { label: "Score", value: score, icon: <Target className="w-4 h-4" /> },
  ];

  const getTileColor = (index: number): RgbColor => 
    index === gameState.outlierIndex ? gameState.outlierRgb : gameState.baseRgb;

  const getRgbStyle = (rgb: RgbColor) => ({
    backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  });

  return (
    <GameWrapper
      title="Chromatic Filter"
      description="Find the odd color tile"
      stats={stats}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <motion.p 
              className="text-center text-white/80 mb-6 text-lg flex items-center justify-center gap-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Eye className="w-5 h-5" />
              Find the one color square that is different
            </motion.p>

            {/* Color Grid Container */}
            <motion.div 
              className="w-full max-w-lg mx-auto h-[350px] p-6 rounded-2xl shadow-2xl transition-all duration-500 flex items-center justify-center"
              style={getRgbStyle(gameState.backgroundRgb)}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-2 gap-4 w-full h-full max-w-sm max-h-sm p-4">
                {Array.from({ length: TILE_COUNT }).map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleTileClick(index)}
                    disabled={isTileLocked}
                    className={`
                      w-full rounded-xl shadow-lg transition-all duration-150
                      ${isTileLocked ? 'opacity-90 cursor-default' : 'hover:scale-105 active:scale-95'}
                      ${index === TILE_COUNT - 1 ? 'col-span-2 mx-auto max-w-[calc(50%-0.5rem)]' : ''}
                    `}
                    style={getRgbStyle(getTileColor(index))}
                    aria-label={`Color tile ${index + 1}`}
                    whileHover={{ scale: isTileLocked ? 1 : 1.05 }}
                    whileTap={{ scale: isTileLocked ? 1 : 0.95 }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
            
            {/* Hint */}
            {isTileLocked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center text-white/70"
              >
                The actual outlier was tile #{gameState.outlierIndex + 1}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-2xl ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              {isCorrect ? 'Excellent!' : 'Incorrect'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {feedbackMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
            <Button onClick={startNewRound} className="bg-gradient-to-r from-indigo-500 to-purple-500">
              <RotateCcw className="w-4 h-4 mr-2" />
              Next Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GameWrapper>
  );
}
