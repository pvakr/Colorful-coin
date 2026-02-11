"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation"
import GameWrapper from "@/components/GameWrapper";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const COLOR_OPTIONS = ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#FF00FF', '#00FFFF'];
const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'MAGENTA', 'CYAN'];
const ROUND_TIME = 3;

export default function ColorConflictGame() {
    const [sessionHighScore, setSessionHighScore] = useState<number>(0);
    const [targetColorName, setTargetColorName] = useState<string>('');
    const [inkColor, setInkColor] = useState<string>('');
    const [score, setScore] = useState<number>(0);
    const [timer, setTimer] = useState<number>(ROUND_TIME);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);

    const generateNewRound = useCallback(() => {
        const targetIndex = Math.floor(Math.random() * COLOR_NAMES.length);
        const inkIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
        setTargetColorName(COLOR_NAMES[targetIndex]);
        setInkColor(COLOR_OPTIONS[inkIndex]);
        setTimer(ROUND_TIME);
    }, []);

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

    const handleChoice = (chosenColorName: string) => {
        if (gameOver || !gameStarted) return;
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

    const displayedWordStyle = {
        color: inkColor,
        fontSize: '3rem',
        fontWeight: '800',
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    };

    return (
        <GameWrapper
            title="Color Conflict"
            description="Stroop Effect test - click the word, not the ink color!"
            stats={[
                { label: "Score", value: score, icon: null },
                { label: "High Score", value: sessionHighScore, icon: null },
            ]}
        >
            <div className="w-full max-w-2xl">
                {!gameStarted || gameOver ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center w-full min-h-[400px] text-center"
                    >
                        {gameOver && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 mb-6 w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl"
                            >
                                <p className="text-2xl font-bold text-white mb-2">Time's Up!</p>
                                <p className="text-white/80">Final Score: {score}</p>
                            </motion.div>
                        )}
                        <Button
                            onClick={startGame}
                            className="bg-white/20 backdrop-blur hover:bg-white/30 text-lg px-8"
                        >
                            {gameOver ? 'Play Again' : 'Start Conflict'}
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
                            className="p-6 mb-6 w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl flex justify-center items-center min-h-[120px]"
                            style={{ minHeight: '120px' }}
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            <div style={displayedWordStyle}>
                                {targetColorName}
                            </div>
                        </motion.div>

                        <p className="text-white/80 mb-4">
                            Time: <span className="font-bold text-red-400">{timer}s</span>
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                            {COLOR_NAMES.map((name, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleChoice(name)}
                                    className="p-4 font-bold rounded-xl shadow-md transition-all duration-150 hover:scale-105 active:scale-95 text-lg text-white"
                                    style={{ backgroundColor: COLOR_OPTIONS[index] }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {name}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </GameWrapper>
    );
}
