"use client";
import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from "next/navigation"; <-- Removed unresolved import
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Constants ---
const GAME_ID = 'color_hex_breaker';
const OPTIONS_COUNT = 9;
const TIME_LIMIT = 5; // Seconds per round

// --- Helper Functions ---

// Generates a random 6-digit hex code
const generateHexCode = (): string => {
  const component = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const r = component();
  const g = component();
  const b = component();
  return `#${r}${g}${b}`.toUpperCase();
};

// --- Main Game Component ---

const HexBreakerGame = () => {
  // const router = useRouter(); // Removed useRouter hook call

  // Session High Score (No persistence)
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);

  const [targetHex, setTargetHex] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]); // Array of hex codes for the choices
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(TIME_LIMIT);
  const [message, setMessage] = useState<string>('Match the hex code to the color!');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Generate a list of unique, random colors, ensuring the target color is one of them
  const generateOptions = useCallback((correctHex: string): string[] => {
    const allOptions = new Set<string>([correctHex]);
    while (allOptions.size < OPTIONS_COUNT) {
      allOptions.add(generateHexCode());
    }
    // Ensure the correct hex is at the beginning, then shuffle
    const optionsArray = [correctHex, ...Array.from(allOptions).filter(h => h !== correctHex)];
    // Shuffle only the necessary amount to achieve randomness across all options
    return optionsArray.sort(() => Math.random() - 0.5);
  }, []);

  const generateRound = useCallback(() => {
    const correctHex = generateHexCode();
    setTargetHex(correctHex);
    setOptions(generateOptions(correctHex));
    setTimer(TIME_LIMIT);
    setMessage('Match the hex code to the color!');
  }, [generateOptions]);

  // Timer Effect
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

  // Handle Game Over and update session high score
  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setSessionHighScore(prevScore => Math.max(prevScore, score));
  }, [score]);

  const handleChoice = (chosenHex: string) => {
    if (gameOver || !gameStarted) return;

    if (chosenHex === targetHex) {
      setScore(s => s + 1);
      setMessage('CORRECT! +1 Point.');
      generateRound(); // Start next round instantly
    } else {
      setMessage(`INCORRECT! Game Over.`);
      handleGameOver();
    }
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    generateRound();
  };
  
  const progressPercent = (timer / TIME_LIMIT) * 100;

  const handleBack = () => {
    // Replace router.push with standard navigation method
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

      <section className="w-full max-w-lg p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-blue-800 mb-2 text-center">Color Hex Breaker</h1>
        <p className="text-md text-gray-600 mb-6 text-center">Quickly find the color swatch matching the hex code before time runs out!</p>
        
        <div className="w-full flex justify-between items-center mb-6 p-3 bg-white rounded-lg shadow-inner">
          <div className="text-xl font-bold text-gray-700">Score: <span className="text-green-600">{score}</span></div>
          <div className="text-xl font-bold text-gray-700">High Score (Session): <span className="text-purple-600">{sessionHighScore}</span></div>
        </div>

        {!gameStarted || gameOver ? (
          <div className="flex flex-col items-center justify-center w-full min-h-[300px]">
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
              {gameOver ? 'Play Again' : 'Start Hex Decryption'}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
              
            {/* Target Hex Code Display */}
            <div className="p-4 mb-4 w-full bg-gray-900 rounded-xl flex justify-center items-center h-20 shadow-2xl">
              <p className="text-4xl font-mono font-extrabold text-yellow-400">
                {targetHex}
              </p>
            </div>
            
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
            
            {/* Color Options Grid */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
              {options.map((hex, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(hex)}
                  className="w-full h-16 rounded-lg shadow-md transition-transform duration-100 hover:scale-105 hover:ring-2 ring-blue-500"
                  style={{ backgroundColor: hex }}
                  disabled={gameOver}
                  aria-label={`Color option ${index + 1}`}
                >
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HexBreakerGame;