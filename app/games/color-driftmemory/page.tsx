'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// --- Type Definitions ---
interface Tile {
  id: number;
  currentHue: number;
  driftRate: number; // Rate of change in HSL hue (degrees per frame)
  isTarget: boolean;
}

// --- Constants ---
const GRID_SIZE = 5;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const TARGET_MULTIPLIER = 5; 
const INITIAL_DRIFT_RATE = 0.05; 
const HUE_RANGE = 360;
const TILE_SIZE_PX = 100;

// --- Utility Functions ---

/** Generates a new random Tile state. */
const createNewTile = (id: number, isTarget: boolean): Tile => {
  const initialHue = Math.random() * HUE_RANGE;
  let driftRate = INITIAL_DRIFT_RATE * (Math.random() > 0.5 ? 1 : -1);

  if (isTarget) {
    // Target drifts faster and in the opposite direction
    driftRate *= -TARGET_MULTIPLIER;
  }

  return { 
    id, 
    currentHue: initialHue, 
    driftRate, 
    isTarget 
  };
};

/** Initializes the 5x5 grid with a single random target tile. */
const initializeTiles = (): Tile[] => {
  const targetId = Math.floor(Math.random() * TILE_COUNT);
  return Array.from({ length: TILE_COUNT }, (_, i) =>
    createNewTile(i, i === targetId)
  );
};

// --- Main Component ---
export default function ColorDriftMemory() {
  // FIX for Hydration: Initialize tiles state to null on the server
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('...');
  
  const animationRef = useRef<number | null>(null); 
  const lastTimeRef = useRef<number>(0); 
  const gameActiveRef = useRef<boolean>(false); // Start as false until mounted

  // Game Loop using requestAnimationFrame
  const gameLoop = useCallback((time: number) => {
    // Only run if the game is active and tiles have been initialized
    if (!gameActiveRef.current) return;
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    setTiles((prevTiles) => {
        // Safe check for null if race condition occurs
        if (!prevTiles) return null; 

        return prevTiles.map((tile) => {
            let newHue = tile.currentHue + tile.driftRate * deltaTime * 0.01;
            newHue = (newHue % HUE_RANGE + HUE_RANGE) % HUE_RANGE;

            // Stabilize the target after a period
            if (tile.isTarget && tile.driftRate < 0) {
                tile.driftRate = Math.min(tile.driftRate + 0.0005 * deltaTime, 0);
            }
            return { ...tile, currentHue: newHue };
        });
    });

    animationRef.current = window.requestAnimationFrame(gameLoop);
  }, []);

// --- Effect to Initialize on Client & Cleanup ---
  useEffect(() => {
    // FIX for Hydration: This runs only on the client after mounting.
    setTiles(initializeTiles());
    gameActiveRef.current = true;
    setMessage('Find the drifting tile!');
    
    lastTimeRef.current = performance.now();
    animationRef.current = window.requestAnimationFrame(gameLoop);

    // Cleanup function
    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Empty dependency array ensures it runs once on mount

// --- Game Logic Functions ---
  
  // Handle player's tile click
  const handleTileClick = (tile: Tile) => {
    if (!gameActiveRef.current || tiles === null) return;

    if (tile.isTarget) {
      const points = 100 + Math.floor(Math.random() * 50);
      setScore((s) => s + points);
      setMessage(`CORRECT! +${points} points. New round...`);
      gameActiveRef.current = false;

      // Start a new round after a short delay
      setTimeout(() => {
        setTiles(initializeTiles());
        setMessage('Find the drifting tile!');
        gameActiveRef.current = true;
        lastTimeRef.current = performance.now();
        
        if (animationRef.current !== null) {
            window.cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = window.requestAnimationFrame(gameLoop);
      }, 700);
    } else {
      setScore((s) => Math.max(0, s - 25)); // Negative points for error
      setMessage('Incorrect! -25 points. Keep watching...');
    }
  };

  // Function to restart the whole game
  const resetGame = () => {
    gameActiveRef.current = false;
    setScore(0);
    setTiles(initializeTiles());
    setMessage('Find the drifting tile!');
    gameActiveRef.current = true;
    lastTimeRef.current = performance.now();

    if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = window.requestAnimationFrame(gameLoop);
  };

// --- Render Logic ---

  // Loading Fallback: Rendered during the hydration phase before the client initializes state.
  if (tiles === null) {
      return (
        <div className="flex flex-col items-center p-5 min-h-screen text-gray-800">
            <h1 className="text-4xl font-bold mt-20">Loading Color Drift Memory...</h1>
        </div>
      );
  }

  // Main Game Render
  return (
    <div className="flex flex-col items-center p-5 min-h-screen text-gray-800">
      
      {/* Back Button */}
      <Link 
        href="/games" 
        className="self-start mb-5 px-4 py-2 text-blue-700 border border-blue-700 rounded-md font-semibold transition duration-200 hover:bg-blue-50"
      >
        ← Back to Games
      </Link>
      
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Color Drift Memory</h1>
        <div className="flex gap-8 justify-center text-xl">
          <p>
            <span className="font-bold">Score:</span> <span className="font-extrabold text-blue-600">{score}</span>
          </p>
          <p className="italic text-gray-600">{message}</p>
        </div>
      </header>

      {/* Grid Container */}
      <div
        className="grid border-4 border-gray-300 shadow-xl"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE_PX}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE_PX}px)`,
          gap: '5px',
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="cursor-pointer transition duration-100 ease-out hover:scale-[1.05] hover:shadow-lg"
            style={{
              width: `${TILE_SIZE_PX}px`,
              height: `${TILE_SIZE_PX}px`,
              // The color is dynamic, generated by the game loop
              backgroundColor: `hsl(${tile.currentHue}, 90%, 55%)`,
            }}
            onClick={() => handleTileClick(tile)}
          ></div>
        ))}
      </div>
      
      {/* Reset Button */}
      <button 
        onClick={resetGame} 
        className="mt-5 px-6 py-2 text-lg font-bold text-white bg-red-600 rounded-md transition duration-200 hover:bg-red-700 shadow-md"
      >
        Reset Game
      </button>

      {/* Instructions */}
      <p className="mt-8 text-lg p-4 bg-gray-100 rounded-lg max-w-xl text-center shadow-inner">
        <span className="font-bold text-red-700">Challenge:</span> Identify the one tile that is drifting **faster** or drifting in **reverse** of the others, then click it.
      </p>
    </div>
  );
}