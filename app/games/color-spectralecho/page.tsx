"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from "next/navigation"

// --- Type Definitions ---
type AdditiveColorName = 'Red' | 'Green' | 'Blue' | 'Cyan' | 'Magenta' | 'Yellow' | 'White' | 'Black';
type SubtractiveFilterName = 'Cyan' | 'Magenta' | 'Yellow';
type GameState = 'ready' | 'flashing' | 'input' | 'over';

interface GameStep {
  targetColor: AdditiveColorName;
  requiredFilters: SubtractiveFilterName[];
}

// Custom type for Canvas Ref to explicitly allow null, fixing the TypeScript error
type CanvasRef = React.RefObject<HTMLCanvasElement | null>;

// --- Constants & Color Maps ---
// Target colors simplified to the six most common in CMY theory
const TARGET_COLORS: AdditiveColorName[] = ['Red', 'Green', 'Blue', 'Cyan', 'Magenta', 'Yellow']; 
const SEQUENCE_LENGTH = 5;
const FLASH_DURATION_MS = 800;
const INPUT_TIME_S = 8.0;

// Map Additive Target Color to the required Subtractive Filters (CMY)
const REQUIRED_FILTERS: Record<AdditiveColorName, SubtractiveFilterName[]> = {
  // Primary Additive Colors (RGB) require two filters to block the two unwanted components
  'Red': ['Magenta', 'Yellow'],
  'Green': ['Cyan', 'Yellow'],
  'Blue': ['Cyan', 'Magenta'],
  
  // Secondary Additive Colors (CMY) require one filter
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


// --- Utility Functions ---

/**
 * Calculates the resultant HEX color from applied CMY filters starting from White light.
 */
const calculateResultantColor = (filters: SubtractiveFilterName[]): string => {
  let r = 255, g = 255, b = 255;

  if (filters.includes('Cyan')) r = 0;
  if (filters.includes('Magenta')) g = 0;
  if (filters.includes('Yellow')) b = 0;

  const toHex = (c: number) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Checks if two arrays contain the same elements, regardless of order.
 */
const arraysEqual = (a: SubtractiveFilterName[], b: SubtractiveFilterName[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
};


// --- React Component ---

const App: React.FC = () => {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [gameSequence, setGameSequence] = useState<GameStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<SubtractiveFilterName[]>([]);
  const [timeLeft, setTimeLeft] = useState(INPUT_TIME_S);
  const [showGuide, setShowGuide] = useState(false); // New state for the guide

  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized drawing function
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

  // Initial/Resultant Draw Effect
  useEffect(() => {
    drawColorCircle(targetCanvasRef, COLOR_HEX.Black);
    drawColorCircle(resultCanvasRef, calculateResultantColor(activeFilters));
  }, [drawColorCircle, activeFilters]);

  // Timer Management Effect
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


  // --- Game Flow Handlers ---

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
      
      // Flash ON
      drawColorCircle(targetCanvasRef, COLOR_HEX[targetColor]);
      await new Promise(resolve => setTimeout(resolve, FLASH_DURATION_MS));
      
      // Flash OFF
      drawColorCircle(targetCanvasRef, COLOR_HEX.Black);
      await new Promise(resolve => setTimeout(resolve, FLASH_DURATION_MS / 2));
    }

    // Sequence finished flashing
    drawColorCircle(targetCanvasRef, COLOR_HEX.Black);
    startInputPhase(sequence);

  }, [drawColorCircle]);
  
  const startInputPhase = useCallback((sequence: GameStep[]) => {
    setGameState('input');
    setCurrentStepIndex(1); // Start at step 1 for input
    setActiveFilters([]);
    setTimeLeft(INPUT_TIME_S);
    
    // Set the target color for the first step cue
    if (sequence.length > 0) {
      drawColorCircle(targetCanvasRef, COLOR_HEX[sequence[0].targetColor]);
    }
  }, [drawColorCircle]);

  const startGame = () => {
    setScore(0);
    const newSequence = generateSequence(SEQUENCE_LENGTH);
    setGameSequence(newSequence);
    
    // Clear the timer from any previous state
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Initial delay before flash sequence starts
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
        // Game Won
        handleGameOver(true, "You successfully reproduced the entire spectrum!");
        return;
      }

      // Move to next step
      setCurrentStepIndex(newStepIndex);
      setActiveFilters([]);
      setTimeLeft(INPUT_TIME_S);
      
      // Update the target color cue for the next step
      drawColorCircle(targetCanvasRef, COLOR_HEX[gameSequence[newStepIndex - 1].targetColor]);
    } else {
      // Game Lost
      const targetName = gameSequence[currentStepIndex - 1].targetColor;
      const required = requiredFilters.join(' + ') || 'None (White)';
      const attempted = activeFilters.join(' + ') || 'None (White)';
      
      handleGameOver(false, `You attempted to make a ${targetName} using ${attempted}, but needed: ${required}.`);
    }
  };
  
  // --- Message Box Logic ---
  const [messageBox, setMessageBox] = useState({
    title: '',
    content: '',
    finalScore: 0,
    isVisible: false,
    onClose: () => {},
  });

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
      console.log("Navigating back to the games list.");
      setGameState('ready'); // Reset game state for demonstration
  };

  // --- Rendering Helpers ---

  const getStatusText = () => {
    if (gameState === 'ready') return "Translate memory of light (RGB) into the required subtractive filters (CMY) under time pressure.";
    if (gameState === 'flashing') return "WATCH: Step " + (currentStepIndex) + " of " + SEQUENCE_LENGTH + " is flashing now...";
    if (gameState === 'input') {
        const targetName = gameSequence[currentStepIndex - 1]?.targetColor || '...';
        return `INPUT: Recreate the ${targetName} for Step ${currentStepIndex}.`;
    }
    return "Game Over.";
  };
  
  const timerColor = timeLeft <= 3.0 ? 'text-red-500' : timeLeft <= 5.0 ? 'text-yellow-400' : 'text-green-400';
  
  const FilterButton: React.FC<{ filter: SubtractiveFilterName, hex: string }> = ({ filter, hex }) => {
    const isActive = activeFilters.includes(filter);
    const shadowColor = `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, 0.7)`;
    
    return (
      <button
        className={`filter-btn py-3 px-6 rounded-full text-black transition duration-200 ${isActive ? 'filter-active' : 'hover:opacity-80'}`}
        style={{
          '--filter-color-shadow': shadowColor,
          backgroundColor: hex,
          pointerEvents: gameState === 'input' ? 'auto' : 'none',
          opacity: gameState === 'input' || gameState === 'flashing' ? 1 : 0.5,
        } as React.CSSProperties}
        onClick={() => handleFilterClick(filter)}
        disabled={gameState !== 'input'}
      >
        {filter}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen relative">
        
      {/* --- Back Button (Fixed Position) --- */}
      <div className="fixed top-6 left-6 z-10">
        <button 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-400 text-white bg-gray-800/80 hover:bg-gray-700/80 px-3 py-1.5"
          onClick={handleBackToGames}
          aria-label="Back to Games"
        >
          {/* ArrowLeft icon (Inline SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
          </svg>
          Back to Games
        </button>
      </div>
      {/* End Back Button */}
      
      {/* Game Container */}
      {/* Increased pt-16 to provide space below the fixed header */}
      <div id="game-container" className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-10 text-white pt-16">
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4 text-cyan-400">
          Spectral Echo
        </h1>
        <p id="status-text" className="text-center text-gray-400 mb-6 text-sm md:text-base h-5">
          {getStatusText()}
        </p>

        {/* Stats and Info */}
        <div className="flex justify-between items-center mb-6 text-lg font-mono">
          <div className="text-green-400">Score: <span id="score">{score}</span></div>
          <div className="text-yellow-400">Step: <span id="current-step">{currentStepIndex}</span>/<span id="total-steps">{SEQUENCE_LENGTH}</span></div>
          <div className={timerColor}>Time: <span id="timer">{timeLeft.toFixed(1)}</span>s</div>
        </div>
        
        {/* Canvas Display Area */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-around">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2 text-gray-300">Target Cue (Memory)</h3>
            <canvas ref={targetCanvasRef} width="150" height="150" className="rounded-full border-4 border-cyan-500 shadow-xl"></canvas>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2 text-gray-300">Your Result (CMY)</h3>
            <canvas ref={resultCanvasRef} width="150" height="150" className="rounded-full border-4 border-cyan-500 shadow-xl"></canvas>
          </div>
        </div>

        {/* Filter Controls */}
        <div id="filter-controls" className="flex justify-center gap-4 mb-8">
          <FilterButton filter="Cyan" hex={COLOR_HEX.Cyan} />
          <FilterButton filter="Magenta" hex={COLOR_HEX.Magenta} />
          <FilterButton filter="Yellow" hex={COLOR_HEX.Yellow} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          {gameState === 'ready' && (
            <button 
              id="start-btn" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-200"
              onClick={startGame}
            >
              Start Sequence (Level {SEQUENCE_LENGTH})
            </button>
          )}
          {gameState === 'input' && (
            <button 
              id="submit-btn" 
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-200"
              onClick={submitAttempt}
            >
              Submit Color
            </button>
          )}
          {gameState === 'flashing' && (
              <div className="text-2xl font-bold py-3 px-8 rounded-xl bg-gray-700 text-indigo-400">
                  Memorize!
              </div>
          )}
        </div>
        
        {/* --- CMY GUIDE SECTION --- */}
        <div className="mt-8 pt-6 border-t border-gray-700">
            <button 
                onClick={() => setShowGuide(!showGuide)}
                className="w-full text-left font-bold text-lg text-cyan-400 hover:text-cyan-300 flex justify-between items-center"
            >
                CMY Translation Guide: How to Play
                <span>{showGuide ? '▲' : '▼'}</span>
            </button>

            {showGuide && (
                <div className="p-4 mt-3 bg-gray-700 rounded-lg shadow-inner">
                    <h4 className="text-xl font-bold mb-2 text-white">The Challenge: Additive vs. Subtractive Color</h4>
                    <p className="mb-4 text-sm text-gray-300">
                        The game shows you a color made of **light (RGB)**, but you must use **filters (CMY)** to create it. You start with **White Light** (Red + Green + Blue). Your task is to select the filters that **block the light components you DON'T want**, leaving only the target color.
                    </p>
                    
                    <h4 className="text-xl font-bold mb-2 text-white">Filter Rules (What Gets Blocked):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-300 mb-4">
                        <li>The **Cyan** filter blocks **Red** light.</li>
                        <li>The **Magenta** filter blocks **Green** light.</li>
                        <li>The **Yellow** filter blocks **Blue** light.</li>
                    </ul>
                    
                    <h4 className="text-xl font-bold mb-2 text-white">Quick Reference Table:</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm bg-gray-800 rounded-lg">
                            <thead>
                                <tr className="text-left text-cyan-300 border-b border-gray-600">
                                    <th className="p-2">Target Color (RGB)</th>
                                    <th className="p-2">Must Block</th>
                                    <th className="p-2">Required Filters (CMY)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-700">
                                    <td className="p-2 text-red-400">Red</td>
                                    <td className="p-2">Green + Blue</td>
                                    <td className="p-2">Magenta + Yellow</td>
                                </tr>
                                <tr>
                                    <td className="p-2 text-green-400">Green</td>
                                    <td className="p-2">Red + Blue</td>
                                    <td className="p-2">Cyan + Yellow</td>
                                </tr>
                                <tr className="bg-gray-700">
                                    <td className="p-2 text-blue-400">Blue</td>
                                    <td className="p-2">Red + Green</td>
                                    <td className="p-2">Cyan + Magenta</td>
                                </tr>
                                <tr>
                                    <td className="p-2 text-cyan-300">Cyan</td>
                                    <td className="p-2">Red</td>
                                    <td className="p-2">Cyan</td>
                                </tr>
                                <tr className="bg-gray-700">
                                    <td className="p-2 text-fuchsia-400">Magenta</td>
                                    <td className="p-2">Green</td>
                                    <td className="p-2">Magenta</td>
                                </tr>
                                <tr>
                                    <td className="p-2 text-yellow-300">Yellow</td>
                                    <td className="p-2">Blue</td>
                                    <td className="p-2">Yellow</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
        
        {/* Game Over / Feedback Message Box */}
        {messageBox.isVisible && (
            <div id="message-box" className="fixed p-8 bg-gray-900 border-4 border-indigo-500 rounded-xl shadow-2xl text-center text-white w-11/12 max-w-md" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 }}>
                <h2 id="message-title" className="text-3xl font-extrabold text-indigo-400 mb-3">{messageBox.title}</h2>
                <p id="message-content" className="text-gray-300 mb-6">{messageBox.content}</p>
                <p className="mb-6">Final Score: <span className="text-3xl font-bold text-yellow-300">{messageBox.finalScore}</span></p>
                <button 
                    id="message-close-btn" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                    onClick={handleCloseMessage}
                >
                    Play Again
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;