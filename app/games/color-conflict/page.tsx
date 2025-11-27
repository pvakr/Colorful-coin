"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation"

// --- Constants ---
const GAME_ID = 'color_conflict';
const COLOR_OPTIONS = ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#FF00FF', '#00FFFF']; // Red, Blue, Green, Yellow, Magenta, Cyan
const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'MAGENTA', 'CYAN'];
const ROUND_TIME = 3; // Seconds

// --- Placeholder Router Implementation ---
// NOTE: In a real Next.js application, useRouter hook would provide this.
// We use a console log here to simulate navigation in the browser environment.
const router = {
    push: (path: string) => {
        console.log(`Simulating router push to: ${path}`);
        // Optionally, use window.location.href = path for actual navigation if needed in the live environment,
        // but keeping it as a console log to respect the user's explicit request to avoid window.location.href.
    }
};

// --- Main Game Component ---

const ColorConflictGame = () => {
  // Keeping track of high score for the current session (no persistence)
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);
  const router = useRouter()
  const [targetColorName, setTargetColorName] = useState<string>(''); // The word to read (e.g., RED)
  const [inkColor, setInkColor] = useState<string>('');             // The color of the ink (e.g., #0000FF - Blue)
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(ROUND_TIME);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // 1. Game Logic
  const generateNewRound = useCallback(() => {
    // Select the word to display (The correct answer)
    const targetIndex = Math.floor(Math.random() * COLOR_NAMES.length);
    // Select the ink color (The distraction/interference)
    const inkIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);

    setTargetColorName(COLOR_NAMES[targetIndex]);
    setInkColor(COLOR_OPTIONS[inkIndex]);
    setTimer(ROUND_TIME);
  }, []);

  // 2. Timer Effect
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          handleGameOver();
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // 3. Handle Game Over and update session high score
  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setSessionHighScore(prevScore => Math.max(prevScore, score));
  }, [score]);

  const handleChoice = (chosenColorName: string) => {
    if (gameOver || !gameStarted) return;

    // The correct choice is the button matching the displayed TEXT (targetColorName)
    if (chosenColorName === targetColorName) {
      setScore(s => s + 1);
      generateNewRound();
    } else {
      handleGameOver();
    }
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    generateNewRound();
  };

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setTimer(ROUND_TIME);
    setTargetColorName('');
    setInkColor('');
  };
  
  // Define the style based on the current ink color
  const displayedWordStyle = {
    color: inkColor,
    fontSize: '5rem', // Large and distracting
    fontWeight: '800',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    transition: 'color 0.3s ease-in-out',
  };
  
  // Navigation function using the conceptual router
  const handleBack = () => {
      router.push("/games");
  };

  return (
    <div>
        <button 
          onClick={handleBack} 
          className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-full shadow-md hover:bg-gray-300 transition duration-150 fixed top-6 left-6 z-10"
        >
          ← Back to Games
        </button>
        <div className="flex flex-col items-center p-8 min-h-[500px] rounded-2xl shadow-xl w-full max-w-lg mx-auto">
      {/* Header and Back Button */}
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-blue-800">Color Conflict</h1>
        
      </div>
      
      <p className="text-md text-gray-600 mb-6">Test your focus (Stroop Effect). Click the button matching the **word**, not the ink color. </p>
      
      <div className="w-full flex justify-between items-center mb-6 p-3 bg-white rounded-lg shadow-inner">
        <div className="text-xl font-bold text-gray-700">Score: <span className="text-green-600">{score}</span></div>
        <div className="text-xl font-bold text-gray-700">High Score (Session): <span className="text-purple-600">{sessionHighScore}</span></div>
      </div>

      {!gameStarted || gameOver ? (
        <div className="flex flex-col items-center justify-center flex-grow w-full">
          {gameOver && (
            <div className="p-8 mb-6 w-full bg-red-100 border-2 border-red-400 rounded-xl shadow-lg">
              <p className="text-4xl font-extrabold text-red-700 mb-4">Time's Up!</p>
              <p className="text-xl font-semibold text-gray-800">Final Score: <span className="text-purple-600">{score}</span></p>
            </div>
          )}
          <button 
            onClick={startGame} 
            className="px-8 py-4 bg-blue-600 text-white text-2xl font-bold rounded-full shadow-lg transition duration-200 transform hover:scale-105 hover:bg-blue-700"
          >
            {gameOver ? 'Play Again' : 'Start Conflict'}
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="p-4 mb-8 w-full bg-yellow-100 border-4 border-yellow-500 rounded-xl flex justify-center items-center h-32">
            <div style={displayedWordStyle}>
              {targetColorName}
            </div>
          </div>
          
          <div className="text-xl font-mono text-gray-700 mb-6">
            Time Left: <span className="text-3xl font-extrabold text-red-600">{timer}</span>s
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {COLOR_NAMES.map((name, index) => (
              <button
                key={index}
                onClick={() => handleChoice(name)}
                className={`p-4 font-bold rounded-xl shadow-md transition-all duration-150 transform hover:scale-105 active:scale-95 text-lg ${
                  gameOver ? 'opacity-50 cursor-not-allowed' : 'shadow-blue-300'
                }`}
                style={{ backgroundColor: COLOR_OPTIONS[index], color: '#fff' }}
                disabled={gameOver}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 text-xs text-gray-400">
          This game tests the Stroop Effect. 
      </div>
    </div>
    </div>
    
  );
};

export default ColorConflictGame;