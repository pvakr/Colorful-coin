"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, RotateCcw, Target, Layers, Palette } from 'lucide-react';
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import GameWrapper from "@/components/GameWrapper";

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Tile extends RgbaColor {
  id: number;
  label: string;
}

const initialCanvasRgba: RgbaColor = { r: 255, g: 255, b: 255, a: 1.0 };
const TILE_COUNT = 4;
const PASS_SCORE_THRESHOLD = 95;

const generateRandomRgba = (): RgbaColor => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
  a: parseFloat((Math.random() * 0.4 + 0.3).toFixed(2)),
});

const rgbaToCss = (rgba: RgbaColor): string => 
  `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;

const blendColors = (foreground: RgbaColor, background: RgbaColor): RgbaColor => {
  const Af = foreground.a;
  const Ab = background.a;
  const Ar = Af + Ab * (1 - Af);

  if (Ar < 1e-6) return { r: 0, g: 0, b: 0, a: 0.0 };
  
  const Rr = (foreground.r * Af + background.r * Ab * (1 - Af)) / Ar;
  const Gr = (foreground.g * Af + background.g * Ab * (1 - Af)) / Ar;
  const Br = (foreground.b * Af + background.b * Ab * (1 - Af)) / Ar;
  
  return {
    r: Math.round(Rr),
    g: Math.round(Gr),
    b: Math.round(Br),
    a: parseFloat(Ar.toFixed(4)),
  };
};

const getSimilarityScore = (target: RgbaColor, player: RgbaColor): number => {
  const scaledTargetA = target.a * 255;
  const scaledPlayerA = player.a * 255;
  const maxDistance = 510; 
  
  const distance = Math.sqrt(
    Math.pow(target.r - player.r, 2) +
    Math.pow(target.g - player.g, 2) +
    Math.pow(target.b - player.b, 2) +
    Math.pow(scaledTargetA - scaledPlayerA, 2)
  );

  return Math.max(0, Math.round(100 * (1 - (distance / maxDistance))));
};

const setupNewPuzzle = (): { target: RgbaColor, sources: Tile[], correctOrder: number[] } => {
  let sources: Tile[] = [];
  let correctOrder: number[] = [];
  const tileLabels = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < TILE_COUNT; i++) {
    sources.push({ ...generateRandomRgba(), id: i, label: tileLabels[i] });
  }

  const indices = Array.from({ length: TILE_COUNT }, (_, i) => i);
  correctOrder = indices.sort(() => Math.random() - 0.5);

  let targetColor = initialCanvasRgba;
  for (const index of correctOrder) {
    targetColor = blendColors(sources[index], targetColor);
  }

  return { target: targetColor, sources, correctOrder };
};

export default function ColorDepthField() {
  const router = useRouter()
  const handleBack = () => router.push("/games");

  const [target, setTarget] = useState<RgbaColor>(initialCanvasRgba);
  const [sources, setSources] = useState<Tile[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);
  const [stackOrder, setStackOrder] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const startNewRound = useCallback(() => {
    const puzzle = setupNewPuzzle();
    setTarget(puzzle.target);
    setSources(puzzle.sources);
    setCorrectOrder(puzzle.correctOrder);
    setStackOrder([]);
    setRound(r => r + 1);
    setIsFeedbackOpen(false);
  }, []);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const blendedColor = useMemo(() => {
    let result = initialCanvasRgba;
    for (const id of stackOrder) {
      const tile = sources.find(s => s.id === id);
      if (tile) {
        result = blendColors(tile, result);
      }
    }
    return result;
  }, [stackOrder, sources]);

  const handleTileClick = (id: number) => {
    if (!stackOrder.includes(id)) {
      setStackOrder(prev => [...prev, id]);
    }
  };

  const handleRemoveLast = () => {
    setStackOrder(prev => prev.slice(0, -1));
  };
  
  const handleReset = () => {
    setStackOrder([]);
  };

  const handleSubmit = () => {
    if (stackOrder.length !== TILE_COUNT) {
      alert("Please stack all 4 tiles before submitting!");
      return;
    }

    const finalScore = getSimilarityScore(target, blendedColor);
    setSimilarityScore(finalScore);
    
    let message = '';
    if (finalScore >= PASS_SCORE_THRESHOLD) {
      const points = Math.floor(finalScore / 10);
      setScore(s => s + points);
      message = `Perfect Blend! You achieved ${finalScore}% similarity, earning ${points} points.`;
    } else {
      message = `Needs refinement. Your stack achieved ${finalScore}% similarity. Check your order!`;
    }
    
    setFeedbackMessage(message);
    setIsFeedbackOpen(true);
  };

  const isSuccess = similarityScore >= PASS_SCORE_THRESHOLD;
  
  const requiredOrderLabels = correctOrder.map(id => sources.find(s => s.id === id)?.label).filter(Boolean).join(' → ');

  const stats: { label: string; value: string | number; icon?: React.ReactNode }[] = [
    { label: "Round", value: round, icon: <RotateCcw className="w-4 h-4" /> },
    { label: "Score", value: score, icon: <Target className="w-4 h-4" /> },
    { label: "Stack", value: `${stackOrder.length}/${TILE_COUNT}`, icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <GameWrapper
      title="Color Depth Field"
      description="Master the art of color blending"
      stats={stats}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <motion.p 
              className="text-center text-white/80 mb-6 text-lg flex items-center justify-center gap-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Palette className="w-5 h-5" />
              Stack tiles to match the target color
            </motion.p>

            {/* Display Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Target */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <h3 className="text-lg font-bold mb-3 text-white/80">Target Layer</h3>
                <div className="relative w-full max-w-xs h-32 rounded-xl shadow-inner border border-white/20" style={{ backgroundColor: rgbaToCss(initialCanvasRgba) }}>
                  <div className="absolute inset-0 bg-gray-200/50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #666 0 10px, #888 0 20px)', backgroundSize: '20px 20px' }} />
                  <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: rgbaToCss(target) }} />
                </div>
                <p className='mt-2 text-sm text-white/60 font-mono'>
                  Opacity: {(target.a * 100).toFixed(1)}%
                </p>
              </motion.div>

              {/* Player Blend */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <h3 className="text-lg font-bold mb-3 text-white/80">Your Blend</h3>
                <div className="relative w-full max-w-xs h-32 rounded-xl shadow-inner border border-white/20" style={{ backgroundColor: rgbaToCss(initialCanvasRgba) }}>
                  <div className="absolute inset-0 bg-gray-200/50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #666 0 10px, #888 0 20px)', backgroundSize: '20px 20px' }} />
                  <div className="absolute inset-0 rounded-xl transition-colors duration-200" style={{ backgroundColor: rgbaToCss(blendedColor) }} />
                </div>
                <p className='mt-2 text-sm text-white/60 font-mono'>
                  Opacity: {(blendedColor.a * 100).toFixed(1)}%
                </p>
              </motion.div>
            </div>

            {/* Available Source Tiles */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <h3 className="text-lg font-bold text-white/80 mb-4 text-center">Available Tiles (Click to Add)</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {sources.map((tile) => (
                  <motion.button
                    key={tile.id}
                    onClick={() => handleTileClick(tile.id)}
                    disabled={stackOrder.includes(tile.id)}
                    className={`
                      relative w-20 h-14 rounded-lg shadow-md transition-all
                      ${stackOrder.includes(tile.id) 
                        ? 'opacity-40 ring-2 ring-white/30 cursor-default' 
                        : 'hover:scale-105 cursor-pointer'}
                    `}
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ddd 0 5px, #fff 0 10px)', backgroundSize: '10px 10px' }}
                    whileHover={{ scale: stackOrder.includes(tile.id) ? 1 : 1.05 }}
                    whileTap={{ scale: stackOrder.includes(tile.id) ? 1 : 0.95 }}
                  >
                    <div 
                      className="absolute inset-0 rounded-lg border border-white/30 flex items-center justify-center text-lg font-bold text-white/90 shadow-inner"
                      style={{ backgroundColor: rgbaToCss(tile) }}
                    >
                      {tile.label}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Stacking Order */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <h3 className="text-lg font-bold text-white/80 mb-3 text-center">Stacking Order</h3>
              <div className="flex items-center justify-center min-h-[40px] flex-wrap gap-2">
                {stackOrder.length === 0 ? (
                  <span className="text-white/40">Stack is empty. Click a tile to begin.</span>
                ) : (
                  stackOrder.map((id, index) => {
                    const tile = sources.find(s => s.id === id);
                    if (!tile) return null;
                    return (
                      <React.Fragment key={id}>
                        {index > 0 && <ChevronRight className="w-4 h-4 text-white/40" />}
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-3 py-1 rounded-full font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                        >
                          {tile.label}
                        </motion.span>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </motion.div>
            
            {/* Control Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-3 flex-wrap"
            >
              <Button onClick={handleRemoveLast} variant="outline" disabled={stackOrder.length === 0} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                Remove Last
              </Button>
              <Button onClick={handleReset} variant="outline" disabled={stackOrder.length === 0} className="border-white/20 hover:bg-white/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={stackOrder.length !== TILE_COUNT}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Submit Blend
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-2xl ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {isSuccess ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              {isSuccess ? 'Perfect Blend!' : 'Needs Work'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              <p>{feedbackMessage}</p>
              {!isSuccess && (
                <p className='mt-3 text-sm text-white/70'>
                  Required Order: <span className='font-mono text-white'>{requiredOrderLabels}</span>
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
            <Button onClick={startNewRound} className="bg-gradient-to-r from-indigo-500 to-purple-500">
              <RotateCcw className="w-4 h-4 mr-2" />
              Next Puzzle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GameWrapper>
  );
}
