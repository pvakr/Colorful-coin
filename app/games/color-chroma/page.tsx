"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GameWrapper from "@/components/GameWrapper";
import { Button } from "@/components/ui/button";
import { LucideGamepad2, LucideRedo } from 'lucide-react';
import { motion } from "framer-motion";

const COLORS = [
    '#FF6347',
    '#4682B4',
    '#3CB371',
    '#FFD700',
    '#9400D3',
];

type Lane = 'left' | 'center' | 'right';

interface GameState {
    playerColorIndex: number;
    isGameOver: boolean;
    score: number;
    gameSpeed: number;
}

interface Obstacle {
    id: number;
    lane: Lane;
    requiredColor: string;
    y: number;
    height: number;
}

const START_SPEED = 0.5;
const PLAYER_COLLISION_LINE_Y = 85;
const OBSTACLE_HEIGHT = 8;

const checkCollision = (gameState: GameState, playerLane: Lane, obstacles: Obstacle[]): boolean => {
    const playerColor = COLORS[gameState.playerColorIndex];
    for (const obs of obstacles) {
        if (
            obs.lane === playerLane &&
            obs.y >= PLAYER_COLLISION_LINE_Y - OBSTACLE_HEIGHT &&
            obs.y <= PLAYER_COLLISION_LINE_Y
        ) {
            if (obs.requiredColor !== playerColor) {
                return true;
            }
        }
    }
    return false;
};

const generateObstacle = (): Obstacle => {
    const newLane: Lane = ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as Lane;
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
        id: Date.now() + Math.random(),
        lane: newLane,
        requiredColor: randomColor,
        y: 0,
        height: OBSTACLE_HEIGHT,
    };
};

export default function ColorChromaGauntlet() {
    const router = useRouter();
    const [gameState, setGameState] = useState<GameState>({
        playerColorIndex: 0,
        isGameOver: false,
        score: 0,
        gameSpeed: START_SPEED,
    });
    const [playerLane, setPlayerLane] = useState<Lane>('center');
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);

    const gameRef = useRef<number | null>(null);
    const lastObstacleTimeRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const stateRef = useRef(gameState);
    const laneRef = useRef(playerLane);
    const obstaclesRef = useRef(obstacles);

    useEffect(() => { stateRef.current = gameState; }, [gameState]);
    useEffect(() => { laneRef.current = playerLane; }, [playerLane]);
    useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);

    const setPlayerColor = useCallback((index: number) => {
        setGameState(prev => ({ ...prev, playerColorIndex: index }));
    }, []);

    const gameLoop = useCallback((currentTime: number) => {
        const currentState = stateRef.current;
        const currentLane = laneRef.current;
        const currentObstacles = obstaclesRef.current;

        if (currentState.isGameOver) {
            if (gameRef.current) cancelAnimationFrame(gameRef.current);
            return;
        }

        if (lastUpdateTimeRef.current === 0) {
            lastUpdateTimeRef.current = currentTime;
            lastObstacleTimeRef.current = currentTime - 2000 + 1000;
            gameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const deltaTime = currentTime - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = currentTime;
        const deltaSeconds = deltaTime / 1000;

        let newObstacles = [...currentObstacles];
        newObstacles = newObstacles.map(obs => ({
            ...obs,
            y: obs.y + currentState.gameSpeed * 60 * deltaSeconds,
        }));

        const activeObstacles = newObstacles.filter(obs => obs.y < 100);
        const obstacleGap = 2000 / currentState.gameSpeed;

        if (currentTime - lastObstacleTimeRef.current > obstacleGap) {
            activeObstacles.push(generateObstacle());
            lastObstacleTimeRef.current = currentTime;
        }

        if (checkCollision(currentState, currentLane, activeObstacles)) {
            setGameState(prev => ({ ...prev, isGameOver: true }));
            return;
        }

        setObstacles(activeObstacles);
        setGameState(prev => ({
            ...prev,
            score: newObstacles.length - activeObstacles.length + prev.score,
            gameSpeed: Math.min(prev.gameSpeed + (0.005 * deltaSeconds), 2.5)
        }));

        gameRef.current = requestAnimationFrame(gameLoop);
    }, []);

    const resetGame = useCallback(() => {
        if (gameRef.current) cancelAnimationFrame(gameRef.current);
        setGameState({
            playerColorIndex: 0,
            isGameOver: false,
            score: 0,
            gameSpeed: START_SPEED,
        });
        setPlayerLane('center');
        setObstacles([]);
        lastObstacleTimeRef.current = 0;
        lastUpdateTimeRef.current = 0;
        gameRef.current = requestAnimationFrame(gameLoop);
    }, [gameLoop]);

    useEffect(() => {
        resetGame();
        return () => {
            if (gameRef.current) cancelAnimationFrame(gameRef.current);
        };
    }, [resetGame]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (gameState.isGameOver) {
                if (event.key === 'Enter') resetGame();
                return;
            }
            switch (event.key) {
                case 'ArrowLeft':
                    setPlayerLane(prevLane => prevLane === 'center' ? 'left' : prevLane === 'right' ? 'center' : 'left');
                    break;
                case 'ArrowRight':
                    setPlayerLane(prevLane => prevLane === 'center' ? 'right' : prevLane === 'left' ? 'center' : 'right');
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState.isGameOver, resetGame]);

    const playerColor = COLORS[gameState.playerColorIndex];

    const laneClass = {
        left: 'left-[16.666%]',
        center: 'left-1/2 -translate-x-1/2',
        right: 'left-[83.333%] -translate-x-full',
    };

    return (
        <GameWrapper
            title="Color Chroma Gauntlet"
            description="Match your color to pass obstacles!"
            stats={[
                { label: "Score", value: gameState.score, icon: null },
                { label: "Speed", value: `${gameState.gameSpeed.toFixed(2)}x`, icon: null },
            ]}
        >
            <div className="w-full max-w-md">
                <motion.div
                    className="relative w-full h-[60vh] min-h-[400px] overflow-hidden rounded-xl border-4 border-white/20 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/80" />

                    <div className="absolute inset-0 flex">
                        <div className="w-1/3 border-r border-white/10" />
                        <div className="w-1/3 border-r border-white/10" />
                        <div className="w-1/3" />
                    </div>

                    {obstacles.map(obs => (
                        <motion.div
                            key={obs.id}
                            className="absolute w-1/3 shadow-lg"
                            style={{
                                top: 0,
                                height: `${obs.height}vh`,
                                backgroundColor: obs.requiredColor,
                                left: obs.lane === 'left' ? 0 : obs.lane === 'center' ? '33.333%' : '66.666%',
                                opacity: 0.8,
                            }}
                            initial={{ y: -20 }}
                            animate={{ y: obs.y * 6 }}
                        />
                    ))}

                    <motion.div
                        className={`absolute bottom-[10vh] ${laneClass[playerLane]} transition-all duration-100`}
                        style={{
                            width: '10%',
                            height: '10%',
                            backgroundColor: playerColor,
                            borderRadius: '50%',
                            boxShadow: `0 0 20px 5px ${playerColor}`,
                        }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <LucideGamepad2 className="absolute inset-0 w-full h-full p-2 text-white/70" />
                    </motion.div>

                    {gameState.isGameOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center"
                        >
                            <motion.h2
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-4xl font-black text-white mb-4"
                            >
                                GAME OVER
                            </motion.h2>
                            <p className="text-xl text-white/80 mb-6">Final Score: {gameState.score}</p>
                            <Button
                                onClick={resetGame}
                                className="bg-white/20 backdrop-blur hover:bg-white/30"
                            >
                                <LucideRedo className="w-4 h-4 mr-2" />
                                Play Again
                            </Button>
                        </motion.div>
                    )}
                </motion.div>

                <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-center text-white/60 mb-4 text-sm">
                        Use Arrow Keys to change lanes
                    </p>
                    <div className="flex justify-center gap-2">
                        {COLORS.map((color, index) => (
                            <motion.button
                                key={index}
                                onClick={() => setPlayerColor(index)}
                                className={`w-10 h-10 rounded-full border-2 transition-all ${
                                    gameState.playerColorIndex === index
                                        ? 'scale-125 border-white shadow-lg ring-2 ring-white/50'
                                        : 'border-white/30 hover:scale-110'
                                }`}
                                style={{ backgroundColor: color }}
                                whileHover={{ scale: gameState.playerColorIndex === index ? 1.2 : 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </GameWrapper>
    );
}
