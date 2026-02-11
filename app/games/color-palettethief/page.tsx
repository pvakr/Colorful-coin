"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Trophy, Target, RotateCcw, Palette, Eye, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import GameWrapper from "@/components/GameWrapper";

// --- Constants ---
const CANVAS_SIZE = 400;
const DOMINANT_COUNT = 5;
const PALETTE_SIZE = 15;
const SHAPE_COUNT = 15;

const ALL_COLORS: string[] = [
  '#FF5733', '#C70039', '#900C3F', '#581845',
  '#FFC300', '#FFD700', '#FFFF00', '#DAF7A6',
  '#00FF00', '#1E8449', '#0B5345', '#154360',
  '#1F618D', '#2E86C1', '#5DADE2', '#AED6F1',
  '#BB8FCE', '#8E44AD', '#7D3C98', '#4A235A',
  '#FF00FF', '#FFB6C1', '#00FFFF', '#00A86B',
];

interface Shape {
  type: 'rect' | 'circle';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const PaletteThiefGame = () => {
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('Identify the 5 dominant colors!');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [targetShapes, setTargetShapes] = useState<Shape[]>([]);
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [selectionPalette, setSelectionPalette] = useState<string[]>([]);
  const [userSelection, setUserSelection] = useState<string[]>([]);

  const handleGameOver = useCallback((finalScore: number) => {
    setGameOver(true);
    setSessionHighScore(prevScore => Math.max(prevScore, finalScore));
  }, []);

  const generateTarget = useCallback(() => {
    const pool = [...ALL_COLORS];
    const newDominantColors: string[] = [];
    for (let i = 0; i < DOMINANT_COUNT; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        newDominantColors.push(pool.splice(randomIndex, 1)[0]);
    }
    setDominantColors(newDominantColors);

    const newShapes: Shape[] = [];
    for (let i = 0; i < SHAPE_COUNT; i++) {
      const isDominant = Math.random() < 0.8;
      let color = isDominant 
          ? newDominantColors[Math.floor(Math.random() * DOMINANT_COUNT)]
          : pool[Math.floor(Math.random() * pool.length)];
      
      const type = Math.random() > 0.5 ? 'rect' : 'circle';
      const size = Math.floor(Math.random() * 60) + 40;
      
      newShapes.push({
          type,
          x: Math.floor(Math.random() * (CANVAS_SIZE - size)),
          y: Math.floor(Math.random() * (CANVAS_SIZE - size)),
          w: size,
          h: type === 'rect' ? size : size,
          color
      });
    }
    setTargetShapes(newShapes);

    const palette = [...newDominantColors];
    while (palette.length < PALETTE_SIZE) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        palette.push(pool[randomIndex]);
    }
    setSelectionPalette(palette.sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    targetShapes.forEach((shape) => {
        ctx.fillStyle = shape.color;
        if (shape.type === 'rect') {
            ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
        } else {
            ctx.beginPath();
            ctx.arc(shape.x + shape.w/2, shape.y + shape.h/2, shape.w/2, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
  }, [targetShapes]);

  useEffect(() => {
    startGame();
  }, []);

  const handlePaletteClick = (color: string) => {
    if (gameOver) return;
    
    setUserSelection(prevSelection => {
        if (prevSelection.includes(color)) {
            return prevSelection.filter(c => c !== color);
        } else if (prevSelection.length < DOMINANT_COUNT) {
            return [...prevSelection, color];
        }
        return prevSelection;
    });
  };

  const submitGuess = () => {
    if (userSelection.length !== DOMINANT_COUNT) {
      setMessage(`Please select exactly ${DOMINANT_COUNT} colors before submitting.`);
      return;
    }
    
    let correctCount = 0;
    userSelection.forEach(selectedColor => {
      if (dominantColors.includes(selectedColor)) {
        correctCount++;
      }
    });
    
    setScore(correctCount);
    setMessage(`Result: You found ${correctCount} out of ${DOMINANT_COUNT} dominant colors!`);
    handleGameOver(correctCount);
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setUserSelection([]);
    generateTarget();
    setMessage('Identify the 5 dominant colors!');
  };
  
  const handleBack = () => {
    window.location.href = "/games";
  };



const stats: { label: string; value: string | number; icon: LucideIcon }[] = [
  { label: "Score", value: `${score}/${DOMINANT_COUNT}`, icon: Trophy },
  { label: "Best", value: `${sessionHighScore}/${DOMINANT_COUNT}`, icon: Target },
  { label: "Round", value: gameStarted ? "Active" : "Ready", icon: Palette },
]


  return (
    <GameWrapper
      title="Color Palette Thief"
      description="Analyze composition, identify dominant colors"
      stats={stats}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <p className={`text-md font-semibold mb-4 text-center ${gameOver ? 'text-red-400' : 'text-white/80'}`}>
              {message}
            </p>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <canvas 
                ref={canvasRef} 
                width={CANVAS_SIZE} 
                height={CANVAS_SIZE} 
                className="w-full border-4 border-white/20 rounded-xl shadow-2xl bg-gray-100"
              />
              {!gameStarted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <Button
                    onClick={startGame}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-xl font-bold px-12 py-6 rounded-full shadow-lg"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Start Palette Thief
                  </Button>
                </div>
              )}
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <h3 className="text-xl font-bold mb-4 text-white/90 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Select {DOMINANT_COUNT} Colors ({userSelection.length}/{DOMINANT_COUNT})
              </h3>
              
              <div className="grid grid-cols-5 gap-2 w-full mb-6">
                {selectionPalette.map((color, index) => {
                    const isSelected = userSelection.includes(color);
                    const isCorrect = gameOver && dominantColors.includes(color);
                    
                    return (
                      <motion.button
                        key={color}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        onClick={() => handlePaletteClick(color)}
                        disabled={gameOver}
                        className={`h-12 rounded-xl shadow-md transition-all duration-150 transform hover:scale-105 
                        ${isSelected ? 'ring-4 ring-offset-2 ring-blue-400' : 'hover:ring-2 hover:ring-white/40'}
                        ${gameOver ? (isCorrect ? 'ring-4 ring-offset-2 ring-green-400' : (isSelected ? 'ring-4 ring-offset-2 ring-red-400 opacity-50' : 'opacity-70')) : ''}
                        `}
                        style={{ backgroundColor: color }}
                        whileHover={{ scale: gameOver ? 1 : 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      />
                    );
                })}
              </div>
              
              <AnimatePresence mode="wait">
                {!gameOver ? (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      onClick={submitGuess}
                      disabled={userSelection.length !== DOMINANT_COUNT}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg font-bold py-6 rounded-xl shadow-lg disabled:opacity-50"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      Submit Guess
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="retry"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      onClick={startGame}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg font-bold py-6 rounded-xl shadow-lg"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Try New Composition
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-white/10 rounded-lg text-center text-sm text-white/70"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    Correct dominant colors highlighted in green
                  </span>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </GameWrapper>
  );
};

export default PaletteThiefGame;
