"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import GameWrapper from "@/components/GameWrapper";
import { Trophy, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

const OPTIONS_COUNT = 9;
const TIME_LIMIT = 5;

const generateHexCode = (): string => {
  const component = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const r = component();
  const g = component();
  const b = component();
  return `#${r}${g}${b}`.toUpperCase();
};

const HexBreakerGame = () => {
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);
  const [targetHex, setTargetHex] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(TIME_LIMIT);
  const [message, setMessage] = useState<string>('Match the hex code to the color!');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const generateOptions = useCallback((correctHex: string): string[] => {
    const allOptions = new Set<string>([correctHex]);
    while (allOptions.size < OPTIONS_COUNT) {
      allOptions.add(generateHexCode());
    }
    const optionsArray = [correctHex, ...Array.from(allOptions).filter(h => h !== correctHex)];
    return optionsArray.sort(() => Math.random() - 0.5);
  }, []);

  const generateRound = useCallback(() => {
    const correctHex = generateHexCode();
    setTargetHex(correctHex);
    setOptions(generateOptions(correctHex));
    setTimer(TIME_LIMIT);
    setMessage('Match the hex code to the color!');
  }, [generateOptions]);

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

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setSessionHighScore(prevScore => Math.max(prevScore, score));
  }, [score]);

  const handleChoice = (chosenHex: string) => {
    if (gameOver || !gameStarted) return;

    if (chosenHex === targetHex) {
      setScore(s => s + 1);
      setMessage('CORRECT! +1 Point.');
      generateRound();
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

  return (
    <GameWrapper
      title="Color Hex Breaker"
      description="Quickly find the color matching the hex code!"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
        { label: "High Score", value: sessionHighScore, icon: <Target className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-lg">
        {!gameStarted || gameOver ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center w-full min-h-[300px]"
          >
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 mb-6 w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl shadow-lg text-center"
              >
                <p className="text-3xl font-bold text-red-400 mb-4">Game Over!</p>
                <p className="text-xl text-white/80">
                  Final Score: <span className="text-yellow-400 font-bold">{score}</span>
                </p>
              </motion.div>
            )}
            <Button
              onClick={startGame}
              className="bg-white text-black hover:bg-gray-200 shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {gameOver ? 'Play Again' : 'Start Hex Decryption'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center"
          >
            <motion.div
              className="p-4 mb-4 w-full bg-gray-900/80 backdrop-blur rounded-xl flex justify-center items-center h-20 shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-4xl font-mono font-extrabold text-yellow-400">
                {targetHex}
              </p>
            </motion.div>

            <div className="w-full h-3 mb-4 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all duration-100 ease-linear"
                initial={{ width: "100%" }}
                animate={{ width: `${progressPercent}%` }}
                style={{
                  backgroundColor: progressPercent > 50 ? '#10B981' : progressPercent > 20 ? '#F59E0B' : '#EF4444'
                }}
              />
            </div>

            <p className="text-md font-medium text-white mb-4 h-6">{message}</p>

            <motion.div
              className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {options.map((hex, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleChoice(hex)}
                  className="w-full h-16 rounded-lg shadow-md hover:ring-2 ring-blue-400"
                  style={{ backgroundColor: hex }}
                  disabled={gameOver}
                  aria-label={`Color option ${index + 1}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </GameWrapper>
  );
};

export default HexBreakerGame;
