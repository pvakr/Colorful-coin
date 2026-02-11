"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Target, Palette } from 'lucide-react';
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import GameWrapper from "@/components/GameWrapper"

// --- Type Definitions ---
interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// --- Utility Functions ---

/** Generates a random RGB color object. */
const generateRandomRgb = (): RgbColor => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
});

/** Converts an RGB object to a Hex color string. */
const rgbToHex = (rgb: RgbColor): string => {
  const componentToHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${componentToHex(rgb.r)}${componentToHex(rgb.g)}${componentToHex(rgb.b)}`;
};

/**
 * Calculates a similarity score (0 to 100) based on Euclidean distance in RGB space.
 * 100 is a perfect match.
 */
const getSimilarityScore = (target: RgbColor, player: RgbColor): number => {
  // Max distance in 3D RGB space (sqrt(3 * 255^2))
  const maxDistance = 441.67; 
  
  const distance = Math.sqrt(
    Math.pow(target.r - player.r, 2) +
    Math.pow(target.g - player.g, 2) +
    Math.pow(target.b - player.b, 2)
  );

  // Normalize distance to a score (100 = max similarity, 0 = min similarity)
  return Math.max(0, Math.round(100 * (1 - (distance / maxDistance))));
};

// --- Main Game Component ---

const initialRgb: RgbColor = { r: 128, g: 128, b: 128 };
const PASS_SCORE_THRESHOLD = 95; // Must achieve 95% similarity or better

export default function ColorFusionLab() {
  const router = useRouter()
  
  const [targetRgb, setTargetRgb] = useState<RgbColor>(initialRgb);
  const [round, setRound] = useState(0); 
  const [playerRgb, setPlayerRgb] = useState<RgbColor>(initialRgb);
  const [score, setScore] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [showTargetRgb, setShowTargetRgb] = useState(false);

  const targetHex = useMemo(() => rgbToHex(targetRgb), [targetRgb]);
  const playerHex = useMemo(() => rgbToHex(playerRgb), [playerRgb]);

  const startNewRound = useCallback(() => {
    setTargetRgb(generateRandomRgb());
    setPlayerRgb(initialRgb);
    setIsFeedbackOpen(false);
    setRound(r => r + 1);
    setShowTargetRgb(false);
  }, []);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const handleSliderChange = (color: keyof RgbColor, value: number) => {
    setPlayerRgb(prev => ({ ...prev, [color]: value }));
  };

  const handleSubmit = () => {
    const finalScore = getSimilarityScore(targetRgb, playerRgb);
    setSimilarityScore(finalScore);
    setShowTargetRgb(true);
    setTimeout(() => {
      setShowTargetRgb(false);
    }, 5000);
    
    if (finalScore >= PASS_SCORE_THRESHOLD) {
      const points = Math.floor(finalScore / 10);
      setScore(s => s + points);
    }
    
    setIsFeedbackOpen(true);
  };

  const handleBack = () => router.push("/games");

  const isSuccess = similarityScore >= PASS_SCORE_THRESHOLD;

  const gameStats = [
    { label: "Round", value: round, icon: RotateCcw },
    { label: "Score", value: score, icon: Target },
    { label: "Match", value: `${similarityScore}%`, icon: Palette },
  ];

  const sliderConfig = [
    { key: 'r' as const, label: 'Red', color: '#ef4444', gradient: 'linear-gradient(to right, #fff 0%, #ef4444 100%)' },
    { key: 'g' as const, label: 'Green', color: '#22c55e', gradient: 'linear-gradient(to right, #fff 0%, #22c55e 100%)' },
    { key: 'b' as const, label: 'Blue', color: '#3b82f6', gradient: 'linear-gradient(to right, #fff 0%, #3b82f6 100%)' },
  ];

  return (
    <GameWrapper
      title="Color Fusion Lab"
      description="Master the art of color mixing"
      stats={gameStats}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Color Display Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20">
          
          {/* Target Color */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-xl font-bold mb-3 text-white/90 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Target Color
              {showTargetRgb && (
                <span className="ml-3 text-sm font-mono text-white/70 transition-opacity duration-300">
                  ({targetRgb.r}, {targetRgb.g}, {targetRgb.b})
                </span>
              )}
            </h2>
            <motion.div 
              className="w-full max-w-xs h-40 rounded-xl shadow-inner transition-colors duration-500 border-2 border-white/20"
              style={{ backgroundColor: targetHex }}
              animate={{ scale: showTargetRgb ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.5, repeat: showTargetRgb ? Infinity : 0, repeatDelay: 1 }}
            />
          </motion.div>

          {/* Player Color */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-xl font-bold mb-3 text-white/90 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Your Color
            </h2>
            <motion.div 
              className="w-full max-w-xs h-40 rounded-xl shadow-inner transition-colors duration-100 border-2 border-white/20"
              style={{ backgroundColor: playerHex }}
            />
          </motion.div>
        </div>

        {/* Sliders */}
        <div className="mt-10 space-y-6">
          {sliderConfig.map(({ key, label, color, gradient }, index) => (
            <motion.div
              key={key}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/10 hover:bg-white/15 transition-all"
            >
              <label className="w-16 text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </label>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={playerRgb[key]}
                  onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer shadow-lg"
                  style={{ background: gradient }}
                />
              </div>
              <span className="w-12 text-center font-mono text-white bg-white/10 rounded-lg py-1">
                {playerRgb[key]}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex justify-center"
        >
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full sm:w-auto text-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 py-6 px-12 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Target className="w-5 h-5 mr-2" />
            Check Fusion
          </Button>
        </motion.div>
      </motion.div>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {isSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400"
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-red-400"
                >
                  <XCircle className="w-8 h-8" />
                </motion.div>
              )}
              {isSuccess ? 'Excellent Match!' : 'Keep Refining'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {isSuccess 
                ? `You achieved ${similarityScore}% similarity, earning ${Math.floor(similarityScore / 10)} points!`
                : `Your similarity was ${similarityScore}%. Try to reach ${PASS_SCORE_THRESHOLD}% or higher.`}
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
