'use client';
import React, { useState, useEffect, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
type RgbColor = [number, number, number];

// --- COLOR UTILITIES (Embedded for self-contained file) ---

/**
 * Converts a hex color string to an RGB array [r, g, b]
 * @param {string} hex - e.g., '#AABBCC'
 * @returns {RgbColor}
 */
function hexToRgb(hex: string): RgbColor {
    if (!hex || hex.length < 7) return [0, 0, 0];
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

/**
 * Converts an RGB array [r, g, b] to a hex string
 * @param {RgbColor} rgb - [r, g, b]
 * @returns {string}
 */
function rgbToHex([r, g, b]: RgbColor): string {
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Generates an array of colors for the linear RGB gradient.
 * @param {number} count - The number of tiles.
 * @param {string} startColor - e.g., '#FF0000'
 * @param {string} endColor - e.g., '#0000FF'
 * @returns {string[]}
 */
function generateGradientColors(count: number, startColor: string, endColor: string): string[] {
    const startRgb = hexToRgb(startColor);
    const endRgb = hexToRgb(endColor);
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
        const fraction = i / (count - 1);
        const r = startRgb[0] + (endRgb[0] - startRgb[0]) * fraction;
        const g = startRgb[1] + (endRgb[1] - startRgb[1]) * fraction;
        const b = startRgb[2] + (endRgb[2] - startRgb[2]) * fraction;
        colors.push(rgbToHex([r, g, b]));
    }

    return colors;
}

/**
 * Creates a mismatched color by a small, level-controlled adjustment to the RGB value.
 * (Simplified Delta-E simulation)
 * @param {string} originalColor - The color to slightly change.
 * @param {number} difficulty - The current level (higher level = smaller diff).
 * @returns {string}
 */
function createMismatchedColor(originalColor: string, difficulty: number): string {
    const rgb = hexToRgb(originalColor);
    // Difficulty is inverted: higher level means smaller difference (e.g., diff = 20 / difficulty)
    const diffMagnitude: number = Math.max(2, 25 - difficulty * 3); 

    // Apply a random perturbation to one channel
    const channelIndex: number = Math.floor(Math.random() * 3); // 0=R, 1=G, 2=B
    const perturbation: number = Math.random() > 0.5 ? diffMagnitude : -diffMagnitude;

    const newRgb: RgbColor = [...rgb];
    newRgb[channelIndex] += perturbation;

    return rgbToHex(newRgb);
}

// --- GAME COMPONENT ---

const NUM_TILES: number = 12;
const INITIAL_LEVEL: number = 1;
const MAX_DIFFICULTY: number = 9; 
const START_COLOR: string = '#FF9900'; 
const END_COLOR: string = '#3300FF'; 
const INITIAL_TIME: number = 30;

export default function App() {
    const [level, setLevel] = useState<number>(INITIAL_LEVEL);
    const [colors, setColors] = useState<string[]>([]);
    const [mismatchedIndex, setMismatchedIndex] = useState<number | null>(null);
    const [score, setScore] = useState<number>(0);
    const [message, setMessage] = useState<string>('Click Start to find the Spectral Mismatch!');
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(INITIAL_TIME);

    // Function to set up the game board for the current level
    const setupLevel = useCallback((): void => {
        // 1. Generate the base gradient colors
        const baseColors: string[] = generateGradientColors(NUM_TILES, START_COLOR, END_COLOR);

        // 2. Select a random index for the mismatched tile (avoiding end caps)
        const randomIndex: number = Math.floor(Math.random() * (NUM_TILES - 2)) + 1; // 1 to NUM_TILES-2

        // 3. Create the mismatched color (difficulty scales with level)
        const difficulty: number = Math.min(MAX_DIFFICULTY, level);
        const originalColor: string = baseColors[randomIndex];
        const mismatchedColor: string = createMismatchedColor(originalColor, difficulty);

        // 4. Create the final color array
        const newColors: string[] = [...baseColors];
        newColors[randomIndex] = mismatchedColor;

        setColors(newColors);
        setMismatchedIndex(randomIndex);
        setMessage(`Level ${level}: Fine visual acuity needed!`);
        setIsGameActive(true);
    }, [level]);

    // Handle tile click
    const handleTileClick = (index: number): void => {
        if (!isGameActive) return;

        if (index === mismatchedIndex) {
            setScore(s => s + 1);
            setMessage(`Correct! Moving to Level ${level + 1}. (+2s)`);
            setLevel(l => l + 1);
            setTimeRemaining(t => t + 2); // Reward for accuracy
        } else {
            setMessage(`Incorrect! Game Over. Final Score: ${score}`);
            setIsGameActive(false);
        }
    };

    // Timer useEffect
    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (isGameActive) {
            timer = setInterval(() => {
                setTimeRemaining(t => {
                    if (t <= 1) {
                        clearInterval(timer);
                        setIsGameActive(false);
                        setMessage(`Time's up! Game Over. Final Score: ${score}`);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => { if (timer) clearInterval(timer); };
    }, [isGameActive, score]);

    // Level setup useEffect
    useEffect(() => {
        if (isGameActive) {
            setupLevel();
        }
    }, [level, isGameActive, setupLevel]);

    // Start/Restart Game Handler
    const startGame = (): void => {
        setScore(0);
        setLevel(INITIAL_LEVEL);
        setTimeRemaining(INITIAL_TIME);
        setIsGameActive(true);
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 font-inter text-gray-800 dark:text-gray-200 w-full">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-500">
                🌈 Spectral Runner
            </h1>

            <div className="mb-6 text-lg sm:text-xl bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow-2xl w-full max-w-2xl flex justify-around">
                <p className="font-semibold text-yellow-500">Score: <span className="font-bold">{score}</span></p>
                <p className="font-semibold text-purple-500">Level: <span className="font-bold">{level}</span></p>
                <p className="font-semibold text-cyan-500">Time: <span className="font-bold">{timeRemaining}s</span></p>
            </div>

            {/* Tile Strip */}
            <div className="w-full max-w-3xl mb-8 border-4 border-gray-400 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xl flex relative">
                {colors.map((color, index) => (
                    <button
                        key={index}
                        onClick={() => handleTileClick(index)}
                        className={`
                            h-24 sm:h-32 flex-grow transition-all duration-100 ease-out 
                            active:scale-95 transform-gpu
                            ${isGameActive ? 'cursor-pointer hover:shadow-inner hover:brightness-110' : 'cursor-default opacity-80'}
                        `}
                        style={{ 
                            backgroundColor: color,
                            flexBasis: `${100 / NUM_TILES}%`,
                            width: `${100 / NUM_TILES}%` // Ensure even distribution
                        }}
                        disabled={!isGameActive}
                        aria-label={`Color tile ${index + 1}`}
                    >
                        {/* Highlight correct tile on game over */}
                        {(!isGameActive && index === mismatchedIndex) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs sm:text-base text-white font-black bg-red-600/80 backdrop-blur-sm p-2 rounded-lg shadow-xl animate-pulse">
                                    MISMATCH
                                </span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className={`text-xl sm:text-2xl font-semibold mb-6 transition-colors duration-500 ${isGameActive ? 'text-green-500' : 'text-red-500'}`}>
                {message}
            </div>

            {/* Buttons Container */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center w-full max-w-lg">
                <button
                    onClick={startGame}
                    className="flex-grow px-10 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full shadow-lg transition duration-300 transform hover:scale-105 uppercase tracking-widest text-lg disabled:opacity-50"
                    disabled={isGameActive && timeRemaining > 0}
                >
                    {isGameActive ? 'Restart Game' : 'Start New Game'}
                </button>
            </div>

            <p className="mt-8 text-xs text-gray-500 max-w-lg text-center">
                *This simulation uses RGB difference to approximate Perceptual Uniformity (Delta-E).
            </p>
        </div>
    );
}