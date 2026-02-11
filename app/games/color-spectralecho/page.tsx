"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from "next/navigation"
import { ArrowLeft, Play, CheckCircle, XCircle, Timer, Target, Brain, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import GameWrapper from "@/components/GameWrapper";

type AdditiveColorName = 'Red' | 'Green' | 'Blue' | 'Cyan' | 'Magenta' | 'Yellow' | 'White' | 'Black';
type SubtractiveFilterName = 'Cyan' | 'Magenta' | 'Yellow';
type GameState = 'ready' | 'flashing' | 'input' | 'over';

interface GameStep {
  targetColor: AdditiveColorName;
  requiredFilters: SubtractiveFilterName[];
}

type CanvasRef = React.RefObject<HTMLCanvasElement | null>;

const TARGET_COLORS: AdditiveColorName[] = ['Red', 'Green', 'Blue', 'Cyan', 'Magenta', 'Yellow']; 
const SEQUENCE_LENGTH = 5;
const FLASH_DURATION_MS = 800;
const INPUT_TIME_S = 8.0;

const REQUIRED_FILTERS: Record<AdditiveColorName, SubtractiveFilterName[]> = {
  'Red': ['Magenta', 'Yellow'],
  'Green': ['Cyan', 'Yellow'],
  'Blue': ['Cyan', 'Magenta'],
  'Cyan': ['Cyan'],
  'Magenta': ['Magenta'],
  'Yellow': ['Yellow'],
  'White': [],
  'Black': ['Cyan', 'Magenta', 'Yellow'],
};

const COLOR_HEX: Record<AdditiveColorName, string> = {
  'Red': '#FF0000', 'Green': '#00FF00', 'Blue': '#0000FF',
  'Cyan': '#00FFFF', 'Magenta': '#FF00FF', 'Yellow': '#FFFF00',
  'White': '#FFFFFF', 'Black': '#111111',
};

const calculateResultantColor = (filters: SubtractiveFilterName[]): string => {
  let r = 255, g = 255, b = 255;
  if (filters.includes('Cyan')) r = 0;
  if (filters.includes('Magenta')) g = 0;
  if (filters.includes('Yellow')) b = 0;
  const toHex = (c: number) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const arraysEqual = (a: SubtractiveFilterName[], b: SubtractiveFilterName[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
};

const App: React.FC = () => {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [gameSequence, setGameSequence] = useState<GameStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<SubtractiveFilterName[]>([]);
  const [timeLeft, setTimeLeft] = useState(INPUT_TIME_S);
  const [showGuide, setShowGuide] = useState(false);
  const [messageBox, setMessageBox] = useState({
    title: '',
    content: '',
    finalScore: 0,
    isVisible: false,
    onClose: () => {},
  });

  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const drawColorCircle = useCallback((canvasRef: CanvasRef, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }, []);

  useEffect(() => {
    drawColorCircle(targetCanvasRef, COLOR_HEX.Black);
    drawColorCircle(resultCanvasRef, calculateResultantColor(activeFilters));
  }, [drawColorCircle, activeFilters]);

  useEffect(() => {
    if (gameState === 'input') {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 0.1;
          if (newTime <= 0) {
            clearInterval(timerIntervalRef.current as NodeJS.Timeout);
            handleGameOver(false, "Time ran out!");
            return 0;
          }
          return parseFloat(newTime.toFixed(1));
        });
      }, 100);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState]);

  const generateSequence = (length: number): GameStep[] => {
    const sequence: GameStep[] = [];
    for (let i = 0; i < length; i++) {
      const randomTarget = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];
      sequence.push({
        targetColor: randomTarget,
        requiredFilters: REQUIRED_FILTERS[randomTarget] || [],
      });
    }
    return sequence;
  };

  const startFlashSequence = useCallback(async (sequence: GameStep[]) => {
    setGameState('flashing');
    
    for (let i = 0; i < sequence.length; i++) {
      setCurrentStepIndex(i + 1);
      const targetColor = sequence[i].targetColor;
      drawColorCircle(targetCanvasRef, COLOR_HEX[targetColor]);
      await new Promise(resolve => setTimeout(resolve, FLASH_DURATION_MS));
      drawColorCircle(targetCanvasRef, COLOR_HEX.Black);
      await new Promise(resolve => setTimeout(resolve, FLASH_DURATION_MS / 2));
    }

    drawColorCircle(targetCanvasRef, COLOR_HEX.Black);
    startInputPhase(sequence);

  }, [drawColorCircle]);
  
  const startInputPhase = useCallback((sequence: GameStep[]) => {
    setGameState('input');
    setCurrentStepIndex(1);
    setActiveFilters([]);
    setTimeLeft(INPUT_TIME_S);
    
    if (sequence.length > 0) {
      drawColorCircle(targetCanvasRef, COLOR_HEX[sequence[0].targetColor]);
    }
  }, [drawColorCircle]);

  const startGame = () => {
    setScore(0);
    const newSequence = generateSequence(SEQUENCE_LENGTH);
    setGameSequence(newSequence);
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setTimeout(() => {
        startFlashSequence(newSequence);
    }, 500);
  };

  const handleFilterClick = (filter: SubtractiveFilterName) => {
    if (gameState !== 'input') return;
    setActiveFilters(prevFilters => {
      if (prevFilters.includes(filter)) {
        return prevFilters.filter(f => f !== filter);
      } else {
        return [...prevFilters, filter];
      }
    });
  };

  const handleGameOver = (won: boolean, message: string) => {
    setGameState('over');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    const title = won ? "VICTORY ACHIEVED!" : "SEQUENCE FAILED";
    showMessage(title, message, score, () => setGameState('ready'));
  };

  const submitAttempt = () => {
    if (gameState !== 'input' || currentStepIndex > gameSequence.length) return;

    const requiredFilters = gameSequence[currentStepIndex - 1].requiredFilters;
    const isCorrect = arraysEqual(activeFilters, requiredFilters);

    if (isCorrect) {
      const points = Math.ceil(timeLeft * 10);
      setScore(s => s + points);
      
      const newStepIndex = currentStepIndex + 1;
      
      if (newStepIndex > gameSequence.length) {
        handleGameOver(true, "You successfully reproduced the entire spectrum!");
        return;
      }

      setCurrentStepIndex(newStepIndex);
      setActiveFilters([]);
      setTimeLeft(INPUT_TIME_S);
      drawColorCircle(targetCanvasRef, COLOR_HEX[gameSequence[newStepIndex - 1].targetColor]);
    } else {
      const targetName = gameSequence[currentStepIndex - 1].targetColor;
      const required = requiredFilters.join(' + ') || 'None (White)';
      const attempted = activeFilters.join(' + ') || 'None (White)';
      handleGameOver(false, `You attempted to make a ${targetName} using ${attempted}, but needed: ${required}.`);
    }
  };

  const showMessage = (title: string, content: string, finalScore: number, onClose: () => void) => {
    setMessageBox({
      title,
      content,
      finalScore,
      isVisible: true,
      onClose,
    });
  };

  const handleCloseMessage = () => {
    messageBox.onClose();
    setMessageBox(prev => ({ ...prev, isVisible: false }));
  };
  
  const handleBackToGames = () => {
      router.push("/games"); 
      setGameState('ready');
  };

  const getStatusText = () => {
    if (gameState === 'ready') return "Translate memory of light (RGB) into the required subtractive filters (CMY) under time pressure.";
    if (gameState === 'flashing') return "WATCH: Step " + (currentStepIndex) + " of " + SEQUENCE_LENGTH + " is flashing now...";
    if (gameState === 'input') {
        const targetName = gameSequence[currentStepIndex - 1]?.targetColor || '...';
        return `INPUT: Recreate the ${targetName} for Step ${currentStepIndex}.`;
    }
    return "Game Over.";
  };
  
  const timerColor = timeLeft <= 3.0 ? 'text-red-400' : timeLeft <= 5.0 ? 'text-yellow-400' : 'text-green-400';

  const stats: { label: string; value: string | number; icon?: React.ReactNode }[] = [
    { label: "Score", value: score, icon: <Target className="w-4 h-4" /> },
    { label: "Step", value: `${currentStepIndex}/${SEQUENCE_LENGTH}`, icon: <Brain className="w-4 h-4" /> },
    { label: "Time", value: `${timeLeft.toFixed(1)}s`, icon: <Timer className="w-4 h-4" /> },
  ];

  const FilterButton: React.FC<{ filter: SubtractiveFilterName, hex: string }> = ({ filter, hex }) => {
    const isActive = activeFilters.includes(filter);
    
    return (
      <motion.button
        className={`py-4 px-8 rounded-full text-black font-bold transition-all ${
          isActive 
            ? 'ring-4 ring-white/50 shadow-2xl scale-110' 
            : 'hover:scale-105 shadow-lg opacity-80'
        }`}
        style={{
          backgroundColor: hex,
          pointerEvents: gameState === 'input' ? 'auto' : 'none',
          opacity: gameState === 'input' || gameState === 'flashing' ? 1 : 0.5,
        }}
        onClick={() => handleFilterClick(filter)}
        disabled={gameState !== 'input'}
        whileHover={{ scale: gameState === 'input' ? 1.1 : 1 }}
        whileTap={{ scale: gameState === 'input' ? 0.95 : 1 }}
      >
        {filter}
      </motion.button>
    );
  };

  return (
    <GameWrapper
      title="Spectral Echo"
      description="Master RGB to CMY color conversion"
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
              className="text-center text-white/80 mb-6 text-lg"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getStatusText()}
            </motion.p>
            
            {/* Canvas Display Area */}
            <div className="flex flex-col md:flex-row gap-8 mb-8 items-center justify-around">
              <motion.div 
                className="text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-bold mb-3 text-white/80 flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  Target Cue (Memory)
                </h3>
                <canvas 
                  ref={targetCanvasRef} 
                  width="150" 
                  height="150" 
                  className="rounded-full border-4 border-cyan-500 shadow-xl"
                />
              </motion.div>
              
              <motion.div 
                className="text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-bold mb-3 text-white/80 flex items-center justify-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Your Result (CMY)
                </h3>
                <canvas 
                  ref={resultCanvasRef} 
                  width="150" 
                  height="150" 
                  className="rounded-full border-4 border-purple-500 shadow-xl"
                />
              </motion.div>
            </div>

            {/* Filter Controls */}
            <motion.div 
              className="flex justify-center gap-4 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <FilterButton filter="Cyan" hex={COLOR_HEX.Cyan} />
              <FilterButton filter="Magenta" hex={COLOR_HEX.Magenta} />
              <FilterButton filter="Yellow" hex={COLOR_HEX.Yellow} />
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {gameState === 'ready' && (
                  <motion.div
                    key="start"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button 
                      onClick={startGame}
                      size="lg"
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-lg font-bold px-12 py-6 rounded-xl shadow-lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Sequence
                    </Button>
                  </motion.div>
                )}
                {gameState === 'input' && (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button 
                      onClick={submitAttempt}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg font-bold px-12 py-6 rounded-xl shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit Color
                    </Button>
                  </motion.div>
                )}
                {gameState === 'flashing' && (
                  <motion.div
                    key="memorize"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-2xl font-bold py-4 px-8 rounded-xl bg-white/10 text-cyan-400"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      Memorize!
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* CMY Guide */}
            <motion.div 
              className="mt-8 pt-6 border-t border-white/10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Collapsible open={showGuide} onOpenChange={setShowGuide}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-white/80 hover:bg-white/10"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      CMY Translation Guide: How to Play
                    </span>
                    <motion.div
                      animate={{ rotate: showGuide ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 p-4 bg-white/5 rounded-xl">
                  <h4 className="text-lg font-bold mb-3 text-white">The Challenge: Additive vs. Subtractive Color</h4>
                  <p className="mb-4 text-sm text-white/70">
                    The game shows you a color made of <strong className="text-cyan-400">light (RGB)</strong>, but you must use <strong className="text-yellow-400">filters (CMY)</strong> to create it. Start with <strong>White Light</strong> (Red + Green + Blue). Your task is to select filters that <strong>block the light components you DON'T want</strong>, leaving only the target color.
                  </p>
                  
                  <h4 className="text-lg font-bold mb-3 text-white">Filter Rules (What Gets Blocked):</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-sm text-white/70 mb-4">
                    <li>The <span className="text-cyan-400 font-bold">Cyan</span> filter blocks <span className="text-red-400">Red</span> light.</li>
                    <li>The <span className="text-fuchsia-400 font-bold">Magenta</span> filter blocks <span className="text-green-400">Green</span> light.</li>
                    <li>The <span className="text-yellow-400 font-bold">Yellow</span> filter blocks <span className="text-blue-400">Blue</span> light.</li>
                  </ul>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {[
                      { target: 'Red', block: 'Green + Blue', filters: 'Magenta + Yellow', color: 'text-red-400' },
                      { target: 'Green', block: 'Red + Blue', filters: 'Cyan + Yellow', color: 'text-green-400' },
                      { target: 'Blue', block: 'Red + Green', filters: 'Cyan + Magenta', color: 'text-blue-400' },
                      { target: 'Cyan', block: 'Red', filters: 'Cyan', color: 'text-cyan-400' },
                      { target: 'Magenta', block: 'Green', filters: 'Magenta', color: 'text-fuchsia-400' },
                      { target: 'Yellow', block: 'Blue', filters: 'Yellow', color: 'text-yellow-400' },
                    ].map((row, i) => (
                      <div key={i} className="bg-white/5 p-3 rounded-lg">
                        <div className={`font-bold ${row.color}`}>{row.target}</div>
                        <div className="text-white/60 text-xs">Block: {row.block}</div>
                        <div className="text-white/80 text-xs font-semibold">→ {row.filters}</div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Game Over Dialog */}
      <Dialog open={messageBox.isVisible} onOpenChange={() => {}}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-2xl ${messageBox.title.includes('VICTORY') ? 'text-green-400' : 'text-red-400'}`}>
              {messageBox.title.includes('VICTORY') ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              {messageBox.title}
            </DialogTitle>
            <DialogDescription className="text-lg text-white/80">
              {messageBox.content}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <span className="text-white/60">Final Score</span>
            <motion.div 
              className="text-5xl font-bold text-yellow-400 mt-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              {messageBox.finalScore}
            </motion.div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseMessage} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GameWrapper>
  );
};

export default App;
