"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameWrapper from "@/components/GameWrapper";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const BOARD_SIZE = 400;
const TARGET_SIZE = 20;
const INITIAL_COLOR_DELTA = 15;
const TIME_LIMIT = 10;

interface Target {
    x: number;
    y: number;
    color: string;
}

const rgbToHex = (r: number, g: number, b: number): string => {
    const componentToHex = (c: number) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
};

const generateBaseColor = (): [number, number, number] => [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
];

const generateTargetColor = (baseR: number, baseG: number, baseX: number, score: number): string => {
    const delta = Math.max(2, INITIAL_COLOR_DELTA - Math.floor(score / 5));
    const applyDelta = (value: number) => {
        const diff = Math.random() > 0.5 ? delta : -delta;
        return value + diff;
    };
    return rgbToHex(applyDelta(baseR), applyDelta(baseG), applyDelta(baseX));
};

export default function ColorCamouflageGame() {
    const [sessionHighScore, setSessionHighScore] = useState<number>(0);
    const [baseColor, setBaseColor] = useState<[number, number, number]>([0, 0, 0]);
    const [target, setTarget] = useState<Target | null>(null);
    const [score, setScore] = useState<number>(0);
    const [timer, setTimer] = useState<number>(TIME_LIMIT);
    const [message, setMessage] = useState<string>('Find the moving shape and click it!');
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const gameBoardRef = useRef<HTMLDivElement>(null);

    const handleGameOver = useCallback(() => {
        setGameOver(true);
        setSessionHighScore(prevScore => Math.max(prevScore, score));
    }, [score]);

    const generateNewRound = useCallback((currentScore: number) => {
        const newBase = generateBaseColor();
        const targetColor = generateTargetColor(...newBase, currentScore);
        const newX = Math.floor(Math.random() * (BOARD_SIZE - TARGET_SIZE));
        const newY = Math.floor(Math.random() * (BOARD_SIZE - TARGET_SIZE));
        setBaseColor(newBase);
        setTarget({ x: newX, y: newY, color: targetColor });
        setTimer(TIME_LIMIT);
    }, []);

    useEffect(() => {
        if (!gameStarted || gameOver) return;
        const interval = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    handleGameOver();
                    setMessage(`Time expired! Final Score: ${score}`);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameStarted, gameOver, score, handleGameOver]);

    useEffect(() => {
        if (!gameStarted || gameOver || !target) return;
        const moveInterval = setInterval(() => {
            setTarget(prev => {
                if (!prev) return null;
                const maxStep = 10;
                const newX = Math.min(BOARD_SIZE - TARGET_SIZE, Math.max(0, prev.x + (Math.random() - 0.5) * maxStep));
                const newY = Math.min(BOARD_SIZE - TARGET_SIZE, Math.max(0, prev.y + (Math.random() - 0.5) * maxStep));
                return { ...prev, x: newX, y: newY };
            });
        }, 300);
        return () => clearInterval(moveInterval);
    }, [gameStarted, gameOver, target]);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (gameOver || !gameStarted || !target || !gameBoardRef.current) return;
        const rect = gameBoardRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        if (clickX >= target.x && clickX <= target.x + TARGET_SIZE && clickY >= target.y && clickY <= target.y + TARGET_SIZE) {
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

    const progressPercent = (timer / TIME_LIMIT) * 100;
    const baseHexColor = rgbToHex(...baseColor);

    return (
        <GameWrapper
            title="Color Camouflage"
            description="Find the hidden moving shape!"
            stats={[
                { label: "Score", value: score, icon: null },
                { label: "High Score", value: sessionHighScore, icon: null },
            ]}
        >
            <div className="w-full max-w-lg">
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
                                <p className="text-2xl font-bold text-white mb-2">Game Over!</p>
                                <p className="text-white/80">{message}</p>
                            </motion.div>
                        )}
                        <Button
                            onClick={startGame}
                            className="bg-white/20 backdrop-blur hover:bg-white/30 text-lg px-8"
                        >
                            {gameOver ? 'Play Again' : 'Start Camouflage Hunt'}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full flex flex-col items-center"
                    >
                        <div className="w-full h-3 mb-4 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                initial={{ width: "100%" }}
                                animate={{ width: `${progressPercent}%` }}
                                style={{
                                    backgroundColor: progressPercent > 50 ? '#10B981' : progressPercent > 20 ? '#F59E0B' : '#EF4444'
                                }}
                            />
                        </div>
                        <p className="text-white/80 mb-4 text-center">{message}</p>
                        <motion.div
                            ref={gameBoardRef}
                            className="relative border-4 border-white/20 rounded-xl overflow-hidden cursor-crosshair shadow-2xl"
                            style={{
                                width: BOARD_SIZE,
                                height: BOARD_SIZE,
                                backgroundColor: baseHexColor,
                            }}
                            onClick={handleClick}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        >
                            {target && (
                                <motion.div
                                    className="absolute rounded-full shadow-lg"
                                    style={{
                                        left: target.x,
                                        top: target.y,
                                        width: TARGET_SIZE,
                                        height: TARGET_SIZE,
                                        backgroundColor: target.color,
                                    }}
                                    animate={{
                                        x: [0, Math.random() * 10 - 5, 0],
                                        y: [0, Math.random() * 10 - 5, 0],
                                    }}
                                    transition={{ duration: 0.3, repeat: Infinity }}
                                />
                            )}
                            <div className="absolute top-2 left-2 text-xs font-bold text-white p-1 rounded bg-black/50">
                                Difficulty: {Math.max(2, INITIAL_COLOR_DELTA - Math.floor(score / 5))} Δ
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </GameWrapper>
    );
}
