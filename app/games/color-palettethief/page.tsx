"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Constants ---
const GAME_ID = 'color_palette_thief';
const CANVAS_SIZE = 400;
const DOMINANT_COUNT = 5; // The number of colors the user must find
const PALETTE_SIZE = 15; // Total number of choices (5 correct + 10 distractors)
const SHAPE_COUNT = 15; // Number of shapes in the composition

// A wide range of distinct hex colors
const ALL_COLORS: string[] = [
  '#FF5733', '#C70039', '#900C3F', '#581845', // Reds/Pinks
  '#FFC300', '#FFD700', '#FFFF00', '#DAF7A6', // Yellows/Greens
  '#00FF00', '#1E8449', '#0B5345', '#154360', // Greens/Dark Blues
  '#1F618D', '#2E86C1', '#5DADE2', '#AED6F1', // Blues
  '#BB8FCE', '#8E44AD', '#7D3C98', '#4A235A', // Purples
  '#FF00FF', '#FFB6C1', '#00FFFF', '#00A86B', // Magentas/Cyans
];

interface Shape {
  type: 'rect' | 'circle';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

// --- Main Game Component ---

const PaletteThiefGame = () => {
  // Session High Score (No persistence)
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('Identify the 5 dominant colors!');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const [targetShapes, setTargetShapes] = useState<Shape[]>([]);
  const [dominantColors, setDominantColors] = useState<string[]>([]); // The 5 correct colors
  const [selectionPalette, setSelectionPalette] = useState<string[]>([]); // All 15 choices
  const [userSelection, setUserSelection] = useState<string[]>([]);

  // 1. Initial Setup
  useEffect(() => {
    // Start the game state setup on mount
    startGame();
  }, []);

  // Handle Game Over and update session high score
  const handleGameOver = useCallback((finalScore: number) => {
    setGameOver(true);
    setSessionHighScore(prevScore => Math.max(prevScore, finalScore));
  }, []);

  const generateTarget = useCallback(() => {
    // 1. Determine the 5 dominant colors for this round
    const pool = [...ALL_COLORS];
    const newDominantColors: string[] = [];
    for (let i = 0; i < DOMINANT_COUNT; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        newDominantColors.push(pool.splice(randomIndex, 1)[0]);
    }
    setDominantColors(newDominantColors);

    // 2. Create the composition of shapes
    const newShapes: Shape[] = [];
    
    // Assign colors to shapes, heavily favoring the dominant colors
    for (let i = 0; i < SHAPE_COUNT; i++) {
      const isDominant = Math.random() < 0.8; // 80% chance to pick a dominant color
      let color = isDominant 
          ? newDominantColors[Math.floor(Math.random() * DOMINANT_COUNT)]
          : pool[Math.floor(Math.random() * pool.length)]; // Pick a random distractor if not dominant

      // Generate random shape properties
      const type = Math.random() > 0.5 ? 'rect' : 'circle';
      const size = Math.floor(Math.random() * 80) + 40; // 40 to 120
      const x = Math.floor(Math.random() * (CANVAS_SIZE - size));
      const y = Math.floor(Math.random() * (CANVAS_SIZE - size));
      
      const newShape: Shape = {
        type, x, y, w: size, h: size, color
      };
      
      newShapes.push(newShape);
    }
    
    setTargetShapes(newShapes);

    // 3. Create the selection palette (Dominant colors + Distractors)
    const distractorPool = [...ALL_COLORS].filter(c => !newDominantColors.includes(c));
    const newSelectionPalette = [...newDominantColors];
    
    // Add distractors until the palette is full
    while (newSelectionPalette.length < PALETTE_SIZE) {
        const randomIndex = Math.floor(Math.random() * distractorPool.length);
        newSelectionPalette.push(distractorPool.splice(randomIndex, 1)[0]);
    }
    
    setSelectionPalette(newSelectionPalette.sort(() => Math.random() - 0.5));
  }, []);
  
  // 2. Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || targetShapes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Shapes
    targetShapes.forEach(shape => {
      ctx.fillStyle = shape.color;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      if (shape.type === 'rect') {
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
      } else {
        const radius = shape.w / 2;
        ctx.beginPath();
        ctx.arc(shape.x + radius, shape.y + radius, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

  }, [targetShapes]);

  const handlePaletteClick = (color: string) => {
    if (gameOver) return;
    
    setUserSelection(prevSelection => {
      if (prevSelection.includes(color)) {
        // Deselect
        return prevSelection.filter(c => c !== color);
      } else if (prevSelection.length < DOMINANT_COUNT) {
        // Select
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
    // Standard client-side navigation
    window.location.href = "/games"; 
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="fixed top-6 left-6 z-10">
            <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border px-3" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
            </Button>
        </div>
        
        <section className="w-full max-w-lg p-8 rounded-2xl shadow-xl bg-gray-50">
            <h1 className="text-3xl font-extrabold text-blue-800 mb-2 text-center">Color Palette Thief</h1>
            <p className="text-md text-gray-600 mb-4 text-center">Analyze the composition below and select the **{DOMINANT_COUNT} most prominent colors** from the palette.</p>
            
            <div className="w-full flex justify-between items-center mb-6 p-3 bg-white rounded-lg shadow-inner">
                <div className="text-xl font-bold text-gray-700">Last Score: <span className="text-green-600">{score} / {DOMINANT_COUNT}</span></div>
                <div className="text-xl font-bold text-gray-700">High Score (Session): <span className="text-purple-600">{sessionHighScore} / {DOMINANT_COUNT}</span></div>
            </div>

            {!gameStarted ? (
                <div className="flex flex-col items-center justify-center flex-grow w-full min-h-[400px]">
                <button 
                    onClick={startGame} 
                    className="px-8 py-4 bg-blue-600 text-white text-2xl font-bold rounded-full shadow-lg transition duration-200 transform hover:scale-105 hover:bg-blue-700"
                >
                    Start Palette Thief
                </button>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center">
                    <p className={`text-md font-semibold mb-4 h-6 ${gameOver ? 'text-red-700' : 'text-gray-800'}`}>{message}</p>
                    
                    {/* Target Image/Composition */}
                    <canvas 
                    ref={canvasRef} 
                    width={CANVAS_SIZE} 
                    height={CANVAS_SIZE} 
                    className="border-4 border-gray-700 rounded-lg shadow-2xl bg-gray-100"
                    />
                    
                    <h3 className="text-xl font-bold mt-6 mb-4 text-gray-800">
                        Select {DOMINANT_COUNT} Colors ({userSelection.length}/{DOMINANT_COUNT})
                    </h3>
                    
                    {/* Selection Palette */}
                    <div className="grid grid-cols-5 gap-2 w-full max-w-sm mb-6">
                    {selectionPalette.map(color => {
                        const isSelected = userSelection.includes(color);
                        const isCorrect = gameOver && dominantColors.includes(color);
                        
                        return (
                        <button
                            key={color}
                            onClick={() => handlePaletteClick(color)}
                            disabled={gameOver}
                            className={`h-12 rounded-lg shadow-md transition-all duration-150 transform hover:scale-105 
                            ${isSelected ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-400'}
                            ${gameOver ? (isCorrect ? 'ring-4 ring-offset-2 ring-green-500' : (isSelected ? 'ring-4 ring-offset-2 ring-red-500' : 'opacity-50')) : ''}
                            `}
                            style={{ backgroundColor: color }}
                        ></button>
                        );
                    })}
                    </div>
                    
                    {!gameOver ? (
                        <button 
                            onClick={submitGuess} 
                            disabled={userSelection.length !== DOMINANT_COUNT}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded-full shadow-lg transition duration-200 transform hover:scale-105 disabled:opacity-50"
                        >
                            Submit Guess
                        </button>
                    ) : (
                        <button 
                            onClick={startGame} 
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg transition duration-200 transform hover:scale-105"
                        >
                            Try New Composition
                        </button>
                    )}

                    {gameOver && (
                        <div className="mt-4 text-sm text-gray-600">
                            Correct Dominant Colors were highlighted in Green.
                        </div>
                    )}
                </div>
            )}
        </section>
    </div>
  );
};

export default PaletteThiefGame;