"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Constants ---
const GAME_ID = 'color_camouflage';
const BOARD_SIZE = 400; // Pixel size of the game board
const TARGET_SIZE = 20; // Pixel size of the moving target
const INITIAL_COLOR_DELTA = 15; // Initial max difference in RGB components (higher is easier)
const TIME_LIMIT = 10; // Seconds per round

interface Target {
  x: number;
  y: number;
  color: string;
}

// --- Helper Functions ---

// Converts RGB components to a hex string
const rgbToHex = (r: number, g: number, b: number): string => {
  const componentToHex = (c: number) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
};

// Generates a random base color
const generateBaseColor = (): [number, number, number] => [
  Math.floor(Math.random() * 256),
  Math.floor(Math.random() * 256),
  Math.floor(Math.random() * 256),
];

// Generates a target color subtly different from the base, using a reduced delta
const generateTargetColor = (baseR: number, baseG: number, baseX: number, score: number): string => {
  // Delta decreases as score increases, making the color closer to the base
  const delta = Math.max(2, INITIAL_COLOR_DELTA - Math.floor(score / 5));
  
  const applyDelta = (value: number) => {
    // Ensure the difference is noticeable but small
    const diff = Math.random() > 0.5 ? delta : -delta;
    return value + diff;
  };

  return rgbToHex(
    applyDelta(baseR),
    applyDelta(baseG),
    applyDelta(baseX)
  );
};

// --- Main Game Component ---

const CamouflageGame = () => {
  // Session High Score (No persistence)
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);

  const [baseColor, setBaseColor] = useState<[number, number, number]>([0, 0, 0]);
  const [target, setTarget] = useState<Target | null>(null);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(TIME_LIMIT);
  const [message, setMessage] = useState<string>('Find the moving shape and click it!');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  
  const gameBoardRef = useRef<HTMLDivElement>(null);

  // 1. Initial State Setup
  useEffect(() => {
    // Start game state setup on mount
    startGame();
  }, []);

  // Handle Game Over and update session high score
  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setSessionHighScore(prevScore => Math.max(prevScore, score));
  }, [score]);

  const generateNewRound = useCallback((currentScore: number) => {
    const newBase = generateBaseColor();
    const targetColor = generateTargetColor(...newBase, currentScore);
    
    // Random position within the board limits
    const newX = Math.floor(Math.random() * (BOARD_SIZE - TARGET_SIZE));
    const newY = Math.floor(Math.random() * (BOARD_SIZE - TARGET_SIZE));
    
    setBaseColor(newBase);
    setTarget({ x: newX, y: newY, color: targetColor });
    setTimer(TIME_LIMIT);
  }, []);

  // 2. Timer Effect
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          handleGameOver();
          clearInterval(interval);
          setMessage(`Time expired! Final Score: ${score}`);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, score, handleGameOver]);
  
  // 3. Target Movement Effect
  useEffect(() => {
    if (!gameStarted || gameOver || !target) return;
    
    const moveInterval = setInterval(() => {
        setTarget(t => {
            if (!t) return null;
            
            // Randomly perturb the target position
            const maxStep = 10;
            const newX = Math.min(BOARD_SIZE - TARGET_SIZE, Math.max(0, t.x + (Math.random() - 0.5) * maxStep));
            const newY = Math.min(BOARD_SIZE - TARGET_SIZE, Math.max(0, t.y + (Math.random() - 0.5) * maxStep));
            
            return { ...t, x: newX, y: newY };
        });
    }, 300); // Moves every 300ms
    
    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver, target]);


  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (gameOver || !gameStarted || !target || !gameBoardRef.current) return;

    const rect = gameBoardRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if the click is within the target area
    if (
      clickX >= target.x && 
      clickX <= target.x + TARGET_SIZE &&
      clickY >= target.y &&
      clickY <= target.y + TARGET_SIZE
    ) {
      setScore(s => {
        const newScore = s + 1;
        setMessage('SUCCESS! Target found.');
        generateNewRound(newScore);
        return newScore;
      });
    } else {
      setMessage('MISS! Game Over.');
      handleGameOver();
    }
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setMessage('Find the moving shape and click it!');
    generateNewRound(0);
  };
  
  const handleBack = () => {
    // Standard client-side navigation
    window.location.href = "/games"; 
  };

  
  const progressPercent = (timer / TIME_LIMIT) * 100;
  const baseHexColor = rgbToHex(...baseColor);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed top-6 left-6 z-10">
        <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border px-3" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="w-full max-w-lg p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-blue-800 mb-2 text-center">Color Camouflage</h1>
        <p className="text-md text-gray-600 mb-6 text-center">Find and click the extremely subtle moving shape before the time runs out!</p>
        
        <div className="w-full flex justify-between items-center mb-6 p-3 bg-white rounded-lg shadow-inner">
          <div className="text-xl font-bold text-gray-700">Score: <span className="text-green-600">{score}</span></div>
          <div className="text-xl font-bold text-gray-700">High Score (Session): <span className="text-purple-600">{sessionHighScore}</span></div>
        </div>

        {!gameStarted || gameOver ? (
          <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
            {gameOver && (
              <div className="p-8 mb-6 w-full bg-red-100 border-2 border-red-400 rounded-xl shadow-lg text-center">
                <p className="text-4xl font-extrabold text-red-700 mb-4">Game Over!</p>
                <p className="text-xl font-semibold text-gray-800">Final Score: <span className="text-purple-600">{score}</span></p>
              </div>
            )}
            <button 
              onClick={startGame} 
              className="px-8 py-4 bg-blue-600 text-white text-2xl font-bold rounded-full shadow-lg transition duration-200 transform hover:scale-105 hover:bg-blue-700"
            >
              {gameOver ? 'Play Again' : 'Start Camouflage Hunt'}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
              
            {/* Timer Bar */}
            <div className="w-full h-3 mb-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                  className="h-full rounded-full transition-all duration-100 ease-linear"
                  style={{ 
                      width: `${progressPercent}%`, 
                      backgroundColor: progressPercent > 50 ? '#10B981' : progressPercent > 20 ? '#F59E0B' : '#EF4444'
                  }}
              ></div>
            </div>
            
            <p className="text-md font-semibold text-gray-800 mb-4 h-6">{message}</p>

            {/* Game Board */}
            <div 
              ref={gameBoardRef}
              className="relative border-4 border-gray-700 cursor-crosshair overflow-hidden"
              style={{ 
                width: BOARD_SIZE, 
                height: BOARD_SIZE,
                backgroundColor: baseHexColor // Base background color
              }}
              onClick={handleClick}
            >
              {/* Target Shape */}
              {target && (
                <div
                  className="absolute rounded-full transition-transform duration-300 ease-out shadow-lg"
                  style={{
                    left: target.x,
                    top: target.y,
                    width: TARGET_SIZE,
                    height: TARGET_SIZE,
                    backgroundColor: target.color,
                  }}
                ></div>
              )}
              
              {/* Visual Difficulty Indicator */}
              <div className="absolute top-2 left-2 text-xs font-bold text-white p-1 rounded bg-black bg-opacity-50">
                  Difficulty: {Math.max(2, INITIAL_COLOR_DELTA - Math.floor(score / 5))} Δ
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CamouflageGame;