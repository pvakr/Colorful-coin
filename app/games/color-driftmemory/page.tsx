"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import GameWrapper from "@/components/GameWrapper";
import { motion } from "framer-motion";

interface Tile {
    id: number;
    currentHue: number;
    driftRate: number;
    isTarget: boolean;
}

const GRID_SIZE = 5;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const TARGET_MULTIPLIER = 5;
const INITIAL_DRIFT_RATE = 0.05;
const HUE_RANGE = 360;

const createNewTile = (id: number, isTarget: boolean): Tile => {
    const initialHue = Math.random() * HUE_RANGE;
    let driftRate = INITIAL_DRIFT_RATE * (Math.random() > 0.5 ? 1 : -1);
    if (isTarget) {
        driftRate *= -TARGET_MULTIPLIER;
    }
    return { id, currentHue: initialHue, driftRate, isTarget };
};

const initializeTiles = (): Tile[] => {
    const targetId = Math.floor(Math.random() * TILE_COUNT);
    return Array.from({ length: TILE_COUNT }, (_, i) => createNewTile(i, i === targetId));
};

export default function ColorDriftMemory() {
    const [tiles, setTiles] = useState<Tile[] | null>(null);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('...');
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const gameActiveRef = useRef<boolean>(false);

    const gameLoop = useCallback((time: number) => {
        if (!gameActiveRef.current) return;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;
        setTiles((prevTiles) => {
            if (!prevTiles) return null;
            return prevTiles.map((tile) => {
                let newHue = tile.currentHue + tile.driftRate * deltaTime * 0.01;
                newHue = (newHue % HUE_RANGE + HUE_RANGE) % HUE_RANGE;
                if (tile.isTarget && tile.driftRate < 0) {
                    tile.driftRate = Math.min(tile.driftRate + 0.0005 * deltaTime, 0);
                }
                return { ...tile, currentHue: newHue };
            });
        });
        animationRef.current = window.requestAnimationFrame(gameLoop);
    }, []);

    useEffect(() => {
        setTiles(initializeTiles());
        gameActiveRef.current = true;
        setMessage('Find the drifting tile!');
        lastTimeRef.current = performance.now();
        animationRef.current = window.requestAnimationFrame(gameLoop);
        return () => {
            if (animationRef.current !== null) {
                window.cancelAnimationFrame(animationRef.current);
            }
        };
    }, [gameLoop]);

    const handleTileClick = (tile: Tile) => {
        if (!gameActiveRef.current || tiles === null) return;
        if (tile.isTarget) {
            const points = 100 + Math.floor(Math.random() * 50);
            setScore((s) => s + points);
            setMessage(`CORRECT! +${points} points. New round...`);
            gameActiveRef.current = false;
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
            setScore((s) => Math.max(0, s - 25));
            setMessage('Incorrect! -25 points. Keep watching...');
        }
    };

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

    if (tiles === null) {
        return (
            <GameWrapper title="Color Drift Memory" description="Loading..." stats={[]}>
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-white/80">Loading...</p>
                </div>
            </GameWrapper>
        );
    }

    return (
        <GameWrapper
            title="Color Drift Memory"
            description="Find the tile that's drifting differently!"
            stats={[
                { label: "Score", value: score, icon: null },
            ]}
        >
            <div className="w-full max-w-xl">
                <motion.div
                    className="grid border-4 border-white/20 rounded-xl shadow-2xl overflow-hidden"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gap: '4px',
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {tiles.map((tile) => (
                        <motion.div
                            key={tile.id}
                            className="aspect-square cursor-pointer transition-all duration-100 ease-out hover:scale-105"
                            style={{
                                backgroundColor: `hsl(${tile.currentHue}, 90%, 55%)`,
                            }}
                            onClick={() => handleTileClick(tile)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        />
                    ))}
                </motion.div>

                <motion.div
                    className="mt-6 flex justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        onClick={resetGame}
                        className="px-6 py-2 bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg font-medium transition"
                    >
                        Reset Game
                    </button>
                </motion.div>

                <motion.p
                    className="mt-4 text-center text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {message}
                </motion.p>
            </div>
        </GameWrapper>
    );
}
