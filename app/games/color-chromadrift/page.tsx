"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from "next/navigation"

// --- Type Definitions and Constants ---

type TileType = 'empty' | 'threat' | 'item' | 'boost';
type GameState = 'playing' | 'over' | 'win';

interface Position {
  x: number;
  y: number;
}

interface Tile {
  id: number;
  type: TileType;
}

const BOARD_SIZE = 12;
const MAX_BOOST_CHARGE = 100;
const BOOST_DRAIN_RATE = 2; // Charge drained per tick/move
const BOOST_REFILL_AMOUNT = 30;
const GAME_TICK_INTERVAL_MS = 200; // Affects boost drain speed

// GUARANTEED COUNTS for a winnable game
const ITEMS_NEEDED_TO_WIN = 5; // Score 50 (5 * 10 points)
const BOOST_TILES_COUNT = 5;
const THREAT_TILES_COUNT = 10;
const WINNING_SCORE = ITEMS_NEEDED_TO_WIN * 10;

// Color Mapping for Visuals (RGB focus for contrast)
const COLOR_MAP: Record<TileType, string> = {
  'empty': '#202020',
  'threat': '#FF4D4D',   // Red
  'item': '#4DFF4D',     // Green
  'boost': '#4D4DFF',    // Blue
};

// --- Initial Board Generation Logic (Guaranteed Win Condition) ---

const createBoard = (size: number): Tile[][] => {
  const board: Tile[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      id: y * size + x,
      type: 'empty',
    }))
  );

  const setTile = (x: number, y: number, type: TileType) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      board[y][x].type = type;
    }
  };

  // 1. Create a list containing the exact number of required tiles
  const tilesToPlace: TileType[] = [
    ...Array(ITEMS_NEEDED_TO_WIN).fill('item'),
    ...Array(BOOST_TILES_COUNT).fill('boost'),
    ...Array(THREAT_TILES_COUNT).fill('threat'),
  ] as TileType[];
  
  // Shuffle the list to randomize placement order
  for (let i = tilesToPlace.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tilesToPlace[i], tilesToPlace[j]] = [tilesToPlace[j], tilesToPlace[i]];
  }

  // 2. Place all tiles onto unique, non-starting positions
  for (const type of tilesToPlace) {
    let x, y;
    do {
      x = Math.floor(Math.random() * size);
      y = Math.floor(Math.random() * size);
    } while (board[y][x].type !== 'empty' || (x === 0 && y === 0));

    setTile(x, y, type);
  }

  return board;
};

// --- Utility Functions ---

// Simulates Deuteranopia (Red/Green confusion) using a CSS filter
const DEUTERANOPIA_FILTER = 'grayscale(80%) sepia(50%) hue-rotate(30deg)';


// --- React Component ---

const App: React.FC = () => {
     const router = useRouter() // ✅ router defined here
  const [board, setBoard] = useState<Tile[][]>(() => createBoard(BOARD_SIZE));
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [gameState, setGameState] = useState<GameState>('playing');
  const [score, setScore] = useState(0);
  const [boostCharge, setBoostCharge] = useState(MAX_BOOST_CHARGE);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [message, setMessage] = useState("Find the items (Green) and avoid the threats (Red)!");

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // --- Game Loop and Boost Management ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (isBoostActive) {
      gameLoopRef.current = setInterval(() => {
        setBoostCharge(prev => {
          const newCharge = Math.max(0, prev - BOOST_DRAIN_RATE);
          if (newCharge === 0) {
            setIsBoostActive(false);
            setMessage("Boost depleted. Rely on non-color cues!");
          }
          return newCharge;
        });
      }, GAME_TICK_INTERVAL_MS);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, isBoostActive]);

  // --- Core Game Logic: Check and Interact ---
  const checkInteraction = useCallback((newPos: Position) => {
    const tile = board[newPos.y][newPos.x];

    if (tile.type === 'threat') {
      // Threat is always fatal regardless of boost state
      setGameState('over');
      setMessage("GAME OVER! You stepped on a threat.");
      return false; // Stop movement
    }

    // Interaction only happens if not empty
    if (tile.type !== 'empty') {
      const newBoard = board.map(row => [...row]);
      
      switch (tile.type) {
        case 'item':
          setScore(s => s + 10);
          setMessage(`Item collected! Score +10.`);
          
          // Check win condition using the constant
          if (score + 10 >= WINNING_SCORE) {
             setGameState('win');
             setMessage("YOU WIN! Excellent chromatic navigation!");
          }
          break;
        case 'boost':
          setBoostCharge(c => Math.min(MAX_BOOST_CHARGE, c + BOOST_REFILL_AMOUNT));
          setMessage(`Boost refilled! +${BOOST_REFILL_AMOUNT} charge.`);
          break;
      }

      // Clear the tile after interaction
      newBoard[newPos.y][newPos.x].type = 'empty';
      setBoard(newBoard);
    }

    setPlayerPos(newPos);
    return true; // Allow movement
  }, [board, isBoostActive, score]);

  // --- Movement Handler ---
  const handleMovement = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    // Check boundaries
    if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
      checkInteraction({ x: newX, y: newY });
    }
  }, [playerPos, gameState, checkInteraction]);

  // --- Keyboard & Touch Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          handleMovement(0, -1);
          break;
        case 'ArrowDown':
          handleMovement(0, 1);
          break;
        case 'ArrowLeft':
          handleMovement(-1, 0);
          break;
        case 'ArrowRight':
          handleMovement(1, 0);
          break;
        case ' ': // Spacebar for Chromatic Boost toggle
        case 'b': 
          e.preventDefault();
          toggleBoost();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMovement]);
  
  // --- Boost Toggle ---
  const toggleBoost = () => {
    if (gameState !== 'playing') return;

    setIsBoostActive(prev => {
      const newState = !prev;
      if (newState) {
        if (boostCharge > 0) {
            setMessage("Chromatic Boost ACTIVE! Colors restored.");
            return true;
        } else {
            setMessage("Boost charge is empty! Collect blue tiles to recharge.");
            return false;
        }
      } else {
        setMessage("Boost INACTIVE. Vision is filtered.");
        return false;
      }
    });
  };

  const handleRestart = () => {
    setBoard(createBoard(BOARD_SIZE));
    setPlayerPos({ x: 0, y: 0 });
    setScore(0);
    setBoostCharge(MAX_BOOST_CHARGE);
    setIsBoostActive(false);
    setGameState('playing');
    setMessage("Find the items (Green) and avoid the threats (Red)!");
  };
  
  // Placeholder for Next.js router navigation
  const handleBackToGames = () => {
    router.push("/games")

      console.log("Navigating back to the games list.");
  };

  // --- Rendering Components ---

  const renderTile = (tile: Tile, x: number, y: number) => {
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const color = COLOR_MAP[tile.type];
    
    // Non-color cues: threats are marked with a distinct pattern when filtered
    const nonColorCue = tile.type === 'threat' && !isBoostActive;
    
    return (
      <div
        key={tile.id}
        className={`w-full h-full relative border border-gray-600 transition-colors duration-200`}
        style={{
          backgroundColor: color,
          backgroundImage: nonColorCue ? 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 1px, transparent 1px, transparent 5px)' : 'none',
        }}
      >
        {isPlayer && (
          <div className="absolute inset-0 flex items-center justify-center text-4xl transform scale-125 transition-transform duration-100">
            <span role="img" aria-label="Player" className="text-white">🚀</span>
          </div>
        )}
      </div>
    );
  };

  const boostProgressStyle = {
    width: `${(boostCharge / MAX_BOOST_CHARGE) * 100}%`,
    backgroundColor: boostCharge > 20 ? '#34D399' : '#F87171', // Green or Red based on charge
  };
  
  // CSS filter applied to the game board container
  const boardFilterStyle = {
      filter: isBoostActive ? 'none' : DEUTERANOPIA_FILTER,
  };


  return (
    <div className="flex items-start justify-center w-full min-h-screen relative p-4 md:p-8">
      
      {/* --- Back Button --- */}
      <div className="fixed top-6 left-6 z-10">
        <button 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-400 text-white bg-gray-800/80 hover:bg-gray-700/80 px-3 py-1.5 shadow-lg"
          onClick={handleBackToGames}
          aria-label="Back to Games"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
          </svg>
          Back to Games
        </button>
      </div>
      
      {/* Game Content */}
      <div id="game-container" className="w-full max-w-4xl bg-gray-900 rounded-2xl shadow-2xl p-6 md:p-10 text-white mt-16">
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4 text-purple-400">
          Chroma Drift
        </h1>
        <p className="text-center text-gray-400 mb-6 text-sm md:text-base">
          **Focus:** Navigate a color-blind world. Use **Chromatic Boost (Space/B)** for temporary clarity.
        </p>

        {/* Status and Stats */}
        <div className="flex justify-between items-center mb-6 text-lg font-mono bg-gray-800 p-3 rounded-lg shadow-inner">
          <div className="text-yellow-400">Score: <span id="score">{score}</span></div>
          <div className={`font-bold ${isBoostActive ? 'text-green-400' : 'text-red-400'}`}>
            Boost: {boostCharge}%
          </div>
        </div>
        
        {/* Boost Bar */}
        <div className="mb-6">
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-100" style={boostProgressStyle}></div>
          </div>
        </div>

        {/* Game Message */}
        <p className={`text-center mb-4 font-semibold p-2 rounded ${gameState === 'over' ? 'bg-red-900 text-red-300' : 'text-cyan-400'}`}>
            {message}
        </p>

        {/* Game Board */}
        <div 
          className="w-full mx-auto aspect-square transition-filter duration-300" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            ...boardFilterStyle
          }}
        >
          {board.flatMap((row, y) => 
            row.map((tile, x) => renderTile(tile, x, y))
          )}
        </div>
        
        {/* Controls */}
        <div className="mt-8 flex flex-col md:flex-row justify-center gap-4">
            <button 
                onClick={toggleBoost}
                disabled={gameState !== 'playing' || boostCharge === 0}
                className={`py-3 px-8 rounded-xl font-bold transition duration-200 shadow-lg ${isBoostActive ? 'bg-orange-500 hover:bg-orange-400' : 'bg-indigo-600 hover:bg-indigo-500'} text-white`}
            >
                {isBoostActive ? `Deactivate Boost (Charge: ${boostCharge}%)` : 'Activate Chromatic Boost (Space/B)'}
            </button>
            <button
                onClick={handleRestart}
                className="py-3 px-8 rounded-xl font-bold transition duration-200 shadow-lg bg-gray-600 hover:bg-gray-500 text-white"
            >
                {gameState === 'playing' ? 'Reset Game' : 'Start New Game'}
            </button>
        </div>
        
        {/* Movement Controls for Touch Devices */}
        <div className="flex justify-center mt-6">
            <div className="grid grid-cols-3 gap-1 w-32 text-white">
                <div></div>
                <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => handleMovement(0, -1)} aria-label="Move Up">↑</button>
                <div></div>
                <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => handleMovement(-1, 0)} aria-label="Move Left">←</button>
                <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => toggleBoost()} aria-label="Boost">B</button>
                <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => handleMovement(1, 0)} aria-label="Move Right">→</button>
                <div></div>
                <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => handleMovement(0, 1)} aria-label="Move Down">↓</button>
                <div></div>
            </div>
        </div>
        
        {/* --- Guide Section --- */}
        <div className="mt-10 pt-6 border-t border-gray-700">
            <h3 className="text-2xl font-bold text-cyan-400 mb-3">Game Guide: Chroma Drift</h3>
            <div className="text-gray-300 space-y-3 text-sm">
                <p>
                    **The Handicap (Deuteranopia):** The game board is visually filtered, making **Threats (Red)** and **Safe Items (Green)** appear nearly identical (both look like a dull yellow/brown).
                </p>
                <p>
                    **The Goal:** Collect **Safe Items (Green)** to score 50 points, avoid **Threats (Red)**, and use **Boost Refills (Blue)** to recharge.
                </p>
                <p>
                    **Chromatic Boost (Space/B):** Activating the boost temporarily removes the color filter, revealing the true colors. Use it sparingly, as it drains your **Boost Charge** quickly.
                </p>
                <p>
                    **Strategy:** When the boost is off, you must rely on **Non-Color Cues**. Notice that **Threats** have a faint diagonal line pattern over them. When the boost is low, this visual handicap is your only clue!
                </p>
            </div>
        </div>

        {/* Game Over Modal (No library needed, using conditional rendering) */}
        {(gameState === 'over' || gameState === 'win') && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className={`p-8 rounded-xl shadow-2xl text-center w-11/12 max-w-md ${gameState === 'win' ? 'bg-green-800' : 'bg-red-800'} border-4 ${gameState === 'win' ? 'border-green-400' : 'border-red-400'}`}>
                    <h2 className="text-4xl font-extrabold mb-3 text-white">
                        {gameState === 'win' ? "MISSION COMPLETE" : "DRIFT FAILED"}
                    </h2>
                    <p className="text-gray-200 mb-6">{message}</p>
                    <p className="mb-6 text-xl font-bold text-yellow-300">Final Score: {score}</p>
                    <button 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
                        onClick={handleRestart}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;