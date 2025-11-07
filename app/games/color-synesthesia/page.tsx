'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

// --- GAME CONFIGURATION AND TYPES ---

// Define the synesthetic mapping
interface SynesthesiaMap {
    color: string;
    emotion: string;
    temperature: string;
}

const SYNESTHESIA_MAP: SynesthesiaMap[] = [
    { color: '#FF0000', emotion: 'Anger', temperature: 'Hot' }, // Red
    { color: '#0047AB', emotion: 'Calm', temperature: 'Cool' },  // Cobalt Blue
    { color: '#FFD700', emotion: 'Joy', temperature: 'Warm' },   // Gold Yellow
    { color: '#228B22', emotion: 'Contentment', temperature: 'Mild' }, // Forest Green
    { color: '#800080', emotion: 'Mystery', temperature: 'Neutral' },  // Purple
];

// The maze grid: Stores indices corresponding to the SYNESTHESIA_MAP.
// 0 = Red, 1 = Blue, 2 = Yellow, 3 = Green, 4 = Purple
// -1 = Wall (unpassable)
// -2 = Goal
const MAZE_GRID: number[][] = [
    [-1, 2, 4, -1, -1],
    [0, -1, 3, 4, -1],
    [1, 0, -1, 3, -1],
    [-1, 1, 0, -1, 2],
    [-1, -1, 1, 2, -2], // Goal at (4, 4)
];

const MAZE_SIZE = MAZE_GRID.length;
const START_POSITION = { row: 0, col: 1 };
const GOAL_POSITION = { row: 4, col: 4 };

// --- UTILITIES ---

/**
 * Gets the color or concept associated with a cell index.
 */
const getCellData = (index: number, key: keyof SynesthesiaMap): string => {
    if (index < 0 || index >= SYNESTHESIA_MAP.length) return '';
    return SYNESTHESIA_MAP[index][key];
};

/**
 * Shuffles an array (Fisher-Yates).
 */
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// --- APP COMPONENT ---

export default function App() {
    const [position, setPosition] = useState<{ row: number, col: number }>(START_POSITION);
    const [score, setScore] = useState<number>(0);
    const [challengeType, setChallengeType] = useState<'emotion' | 'temperature'>('emotion');
    const [message, setMessage] = useState<string>('Welcome to the Synesthesia Maze! Select the correct Emotion to move.');
    const [isGameOver, setIsGameOver] = useState<boolean>(false);

    // Determines the required answer and possible choices for the current cell
    const currentCellIndex = MAZE_GRID[position.row][position.col];
    const requiredAnswer = getCellData(currentCellIndex, challengeType);

    const availableChoices = useMemo(() => {
        // Gather all possible concepts for the current challenge type
        const allConcepts = SYNESTHESIA_MAP.map(map => map[challengeType]);
        
        // Ensure the required answer is included, and shuffle them
        let choices = [requiredAnswer];
        
        // Add random concepts, ensuring no duplicates
        while (choices.length < 4) {
            const randomConcept = allConcepts[Math.floor(Math.random() * allConcepts.length)];
            if (!choices.includes(randomConcept)) {
                choices.push(randomConcept);
            }
        }
        return shuffleArray(choices);
    }, [currentCellIndex, challengeType, requiredAnswer]);


    // Handle the player selecting an associative concept
    const handleChoice = useCallback((choice: string) => {
        if (isGameOver) return;
        
        if (choice === requiredAnswer) {
            setScore(s => s + 1);
            setMessage(`Correct! The ${challengeType} associated with this color is ${requiredAnswer}.`);
            
            // Toggle the challenge type for the next move
            setChallengeType(prev => (prev === 'emotion' ? 'temperature' : 'emotion'));

            // Determine possible next steps (Up, Down, Left, Right)
            const nextSteps = [
                { r: position.row - 1, c: position.col }, // Up
                { r: position.row + 1, c: position.col }, // Down
                { r: position.row, c: position.col - 1 }, // Left
                { r: position.row, c: position.col + 1 }, // Right
            ].filter(nextPos => {
                // Check boundaries
                if (nextPos.r < 0 || nextPos.r >= MAZE_SIZE || nextPos.c < 0 || nextPos.c >= MAZE_SIZE) {
                    return false;
                }
                // Check for walls (-1)
                const nextCellIndex = MAZE_GRID[nextPos.r][nextPos.c];
                return nextCellIndex !== -1;
            });
            
            if (nextSteps.length > 0) {
                // For simplicity, just move the player randomly to a valid adjacent cell
                const nextMove = nextSteps[Math.floor(Math.random() * nextSteps.length)];

                if (nextMove.r === GOAL_POSITION.row && nextMove.c === GOAL_POSITION.col) {
                    setMessage(`Goal Reached! Score: ${score + 1}. You are a true Synesthete!`);
                    setIsGameOver(true);
                    return;
                }
                
                setPosition({ row: nextMove.r, col: nextMove.c });
            } else {
                setMessage(`You are stuck! Game Over. Final Score: ${score}.`);
                setIsGameOver(true);
            }

        } else {
            setMessage(`Incorrect! "${choice}" is wrong. Game Over. Final Score: ${score}.`);
            setIsGameOver(true);
        }
    }, [position, requiredAnswer, challengeType, score, isGameOver]);

    const startGame = () => {
        setPosition(START_POSITION);
        setScore(0);
        setChallengeType('emotion');
        setMessage('Find the Goal! Select the correct association to move.');
        setIsGameOver(false);
    };

    // --- SUB-COMPONENTS ---

    const MazeCell: React.FC<{ index: number, isCurrent: boolean, isGoal: boolean }> = ({ index, isCurrent, isGoal }) => {
        let backgroundColor = '#374151'; // Wall color (gray-700)
        let content = '';

        if (index === -2) { // Goal
            backgroundColor = '#10B981'; // Emerald-500
            content = isCurrent ? 'GOAL!' : 'Goal';
        } else if (index !== -1) { // Normal colored block
            backgroundColor = getCellData(index, 'color');
            content = isCurrent ? 'YOU' : '';
        }

        // Current cell styling
        const currentStyle = isCurrent ? 
            'border-4 border-yellow-400 shadow-xl scale-105 z-10 transition-transform duration-300' : 
            'border-2 border-gray-600 dark:border-gray-800';

        return (
            <div 
                className={`w-full aspect-square flex items-center justify-center font-bold text-sm sm:text-lg rounded-lg ${currentStyle}`}
                style={{ backgroundColor }}
            >
                {content}
            </div>
        );
    };

    return (
        // Wrapper for centering the entire component on the screen
        <div className="flex flex-col items-center justify-center w-full min-h-screen p-4">
            
            {/* Primary Content Block (max-width enforced here) */}
            <div className="flex flex-col items-center p-4 font-inter text-gray-800 dark:text-gray-200 w-full max-w-2xl">
                <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-600">
                    Synesthesia Maze
                </h1>
                
                <div className="w-full mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between font-semibold mb-2">
                        <p className="text-cyan-500">Score: <span className="font-bold">{score}</span></p>
                        <p className="text-indigo-500">Challenge: <span className="font-bold uppercase">{challengeType}</span></p>
                    </div>
                    <div className="text-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {message}
                    </div>
                </div>

                {/* Maze Grid */}
                <div className="w-full max-w-sm aspect-square grid gap-1 p-6 rounded-xl shadow-2xl bg-gray-200 dark:bg-gray-700"
                    style={{ gridTemplateColumns: `repeat(${MAZE_SIZE}, 1fr)` }}>
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
                </div>

                <h3 className="text-xl font-semibold mt-8 mb-4">
                    What is the correct <span className="text-indigo-400 uppercase">{challengeType}</span> association?
                </h3>

                {/* Choice Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    {availableChoices.map((choice) => (
                        <button
                            key={choice}
                            onClick={() => handleChoice(choice)}
                            className={`
                                py-3 px-4 rounded-xl font-bold uppercase text-sm 
                                transition duration-150 transform active:scale-95
                                ${isGameOver 
                                    ? 'bg-gray-500 cursor-not-allowed' 
                                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md'
                                }
                            `}
                            disabled={isGameOver}
                        >
                            {choice}
                        </button>
                    ))}
                </div>

                {/* Game Control Button */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center w-full max-w-lg">
                    <a 
                        href="/games" 
                        className="flex-shrink-0 flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 tracking-widest text-lg uppercase"
                    >
                        &larr; Back to Games
                    </a>
                    <button
                        onClick={startGame}
                        className="flex-grow px-10 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg transition duration-300 transform hover:scale-105 uppercase tracking-widest text-lg"
                    >
                        {isGameOver ? 'Play Again' : 'Restart Maze'}
                    </button>
                </div>

                <p className="mt-8 text-xs text-gray-500 max-w-lg text-center">
                    *The next move is randomly selected from adjacent, non-wall cells.
                </p>
            </div>
        </div>
    );
}