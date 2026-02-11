"use client";
import React, { useState, useCallback, useMemo } from 'react';
import GameWrapper from "@/components/GameWrapper";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SynesthesiaMap {
    color: string;
    emotion: string;
    temperature: string;
}

const SYNESTHESIA_MAP: SynesthesiaMap[] = [
    { color: '#FF0000', emotion: 'Anger', temperature: 'Hot' },
    { color: '#0047AB', emotion: 'Calm', temperature: 'Cool' },
    { color: '#FFD700', emotion: 'Joy', temperature: 'Warm' },
    { color: '#228B22', emotion: 'Contentment', temperature: 'Mild' },
    { color: '#800080', emotion: 'Mystery', temperature: 'Neutral' },
];

const MAZE_GRID: number[][] = [
    [-1, 2, 4, -1, -1],
    [0, -1, 3, 4, -1],
    [1, 0, -1, 3, -1],
    [-1, 1, 0, -1, 2],
    [-1, -1, 1, 2, -2],
];

const MAZE_SIZE = MAZE_GRID.length;
const START_POSITION = { row: 0, col: 1 };
const GOAL_POSITION = { row: 4, col: 4 };

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export default function SynesthesiaMaze() {
    const [position, setPosition] = useState<{ row: number, col: number }>(START_POSITION);
    const [score, setScore] = useState<number>(0);
    const [challengeType, setChallengeType] = useState<'emotion' | 'temperature'>('emotion');
    const [message, setMessage] = useState<string>('Welcome! Select the correct association to move.');
    const [isGameOver, setIsGameOver] = useState<boolean>(false);

    const currentCellIndex = MAZE_GRID[position.row][position.col];
    const requiredAnswer = SYNESTHESIA_MAP[currentCellIndex][challengeType];

    const availableChoices = useMemo(() => {
        const allConcepts = SYNESTHESIA_MAP.map(map => map[challengeType]);
        let choices = [requiredAnswer];
        while (choices.length < 4) {
            const randomConcept = allConcepts[Math.floor(Math.random() * allConcepts.length)];
            if (!choices.includes(randomConcept)) {
                choices.push(randomConcept);
            }
        }
        return shuffleArray(choices);
    }, [currentCellIndex, challengeType, requiredAnswer]);

    const handleChoice = useCallback((choice: string) => {
        if (isGameOver) return;
        if (choice === requiredAnswer) {
            setScore(s => s + 1);
            setChallengeType(prev => (prev === 'emotion' ? 'temperature' : 'emotion'));
            const nextSteps = [
                { r: position.row - 1, c: position.col },
                { r: position.row + 1, c: position.col },
                { r: position.row, c: position.col - 1 },
                { r: position.row, c: position.col + 1 },
            ].filter(nextPos => {
                if (nextPos.r < 0 || nextPos.r >= MAZE_SIZE || nextPos.c < 0 || nextPos.c >= MAZE_SIZE) {
                    return false;
                }
                const nextCellIndex = MAZE_GRID[nextPos.r][nextPos.c];
                return nextCellIndex !== -1;
            });
            if (nextSteps.length > 0) {
                const nextMove = nextSteps[Math.floor(Math.random() * nextSteps.length)];
                if (nextMove.r === GOAL_POSITION.row && nextMove.c === GOAL_POSITION.col) {
                    setMessage(`Goal Reached! You are a true Synesthete!`);
                    setIsGameOver(true);
                    return;
                }
                setPosition({ row: nextMove.r, col: nextMove.c });
            } else {
                setMessage(`You are stuck! Game Over.`);
                setIsGameOver(true);
            }
        } else {
            setMessage(`Incorrect! Game Over.`);
            setIsGameOver(true);
        }
    }, [position, requiredAnswer, challengeType, isGameOver]);

    const startGame = () => {
        setPosition(START_POSITION);
        setScore(0);
        setChallengeType('emotion');
        setMessage('Find the Goal!');
        setIsGameOver(false);
    };

    const MazeCell = ({ index, isCurrent, isGoal }: { index: number; isCurrent: boolean; isGoal: boolean }) => {
        let backgroundColor = '#374151';
        let content = '';
        if (index === -2) {
            backgroundColor = '#10B981';
            content = isCurrent ? 'GOAL!' : 'Goal';
        } else if (index !== -1) {
            backgroundColor = SYNESTHESIA_MAP[index].color;
            content = isCurrent ? 'YOU' : '';
        }
        const currentStyle = isCurrent ?
            'border-4 border-yellow-400 shadow-xl scale-105 z-10' :
            'border-2 border-white/20';
        return (
            <div
                className={`aspect-square flex items-center justify-center font-bold text-sm sm:text-lg rounded-lg ${currentStyle}`}
                style={{ backgroundColor }}
            >
                {content}
            </div>
        );
    };

    return (
        <GameWrapper
            title="Synesthesia Maze"
            description="Navigate using color associations!"
            stats={[
                { label: "Score", value: score, icon: null },
                { label: "Challenge", value: challengeType.toUpperCase(), icon: null },
            ]}
        >
            <div className="w-full max-w-xl">
                <motion.div
                    className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="text-center font-medium">{message}</p>
                </motion.div>

                <motion.div
                    className="grid gap-1 p-4 rounded-xl shadow-2xl bg-white/5"
                    style={{ gridTemplateColumns: `repeat(${MAZE_SIZE}, 1fr)` }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {MAZE_GRID.flatMap((row, rIndex) =>
                        row.map((cellIndex, cIndex) => (
                            <MazeCell
                                key={`${rIndex}-${cIndex}`}
                                index={cellIndex}
                                isCurrent={rIndex === position.row && cIndex === position.col}
                                isGoal={cellIndex === -2}
                            />
                        ))
                    )}
                </motion.div>

                <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-center mb-4 font-medium">
                        What is the correct <span className="text-indigo-400 font-bold">{challengeType}</span> for this color?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {availableChoices.map((choice) => (
                            <motion.button
                                key={choice}
                                onClick={() => handleChoice(choice)}
                                disabled={isGameOver}
                                className="p-4 rounded-xl font-bold uppercase text-sm bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {choice}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    className="mt-6 flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button onClick={startGame} className="bg-white/20 backdrop-blur hover:bg-white/30">
                        {isGameOver ? 'Play Again' : 'Restart'}
                    </Button>
                </motion.div>
            </div>
        </GameWrapper>
    );
}
