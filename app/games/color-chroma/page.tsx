"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { LucideGamepad2, LucideRotateCw, LucideRedo, LucideArrowLeft } from 'lucide-react';

// --- 1. CONFIGURATION AND TYPES (TypeScript Interfaces) ---

// Define the available colors for the player and obstacles
const COLORS = [
    '#FF6347', // Tomato Red
    '#4682B4', // Steel Blue
    '#3CB371', // Medium Sea Green
    '#FFD700', // Gold Yellow
    '#9400D3', // Dark Violet
];

// Define the lanes for movement and obstacles
type Lane = 'left' | 'center' | 'right';

// Interface for the overall Game State
interface GameState {
    playerColorIndex: number; // Index into the COLORS array
    isGameOver: boolean;
    score: number;
    gameSpeed: number; // Controls obstacle movement speed (pixels per frame)
}

// Interface for an individual obstacle
interface Obstacle {
    id: number;
    lane: Lane;
    requiredColor: string;
    // Y position is 0 (top) to 100 (bottom) as a percentage for responsive positioning
    y: number;
    height: number;
}

// --- 2. GAME CONSTANTS ---

const START_SPEED = 0.5; // Initial scroll speed (in percentage points per frame)
const LANE_WIDTH_CLASS = 'w-1/3';
const PLAYER_COLLISION_LINE_Y = 85; // Player is conceptually at 85% down the screen
const OBSTACLE_HEIGHT = 8; // Obstacle height as a percentage of game height

// --- 3. CORE LOGIC FUNCTIONS ---

/**
 * Checks for collision between the player and any active obstacle.
 */
const checkCollision = (gameState: GameState, playerLane: Lane, obstacles: Obstacle[]): boolean => {
    const playerColor = COLORS[gameState.playerColorIndex];

    for (const obs of obstacles) {
        // Check if the obstacle is in the same lane and within the collision zone
        if (
            obs.lane === playerLane &&
            obs.y >= PLAYER_COLLISION_LINE_Y - OBSTACLE_HEIGHT &&
            obs.y <= PLAYER_COLLISION_LINE_Y
        ) {
            // Check for color mismatch
            if (obs.requiredColor !== playerColor) {
                return true; // Collision detected!
            }
        }
    }
    return false;
};

/**
 * Generates a new random obstacle at the top of the screen (y=0).
 */
const generateObstacle = (lastObstacle?: Obstacle): Obstacle => {
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

// --- 4. REACT COMPONENTS ---

/**
 * Renders the Player character.
 */
const Player: React.FC<{ color: string, lane: Lane }> = React.memo(({ color, lane }) => {
    const laneClass = {
        left: 'left-[16.666%]', // 1/6
        center: 'left-1/2 -translate-x-1/2',
        right: 'left-[83.333%] -translate-x-full', // 5/6
    }[lane];

    return (
        <div
            className={`absolute bottom-[10vh] ${laneClass} transition-all duration-100 ease-in-out`}
            style={{ width: '10%', height: '10%', backgroundColor: color, borderRadius: '50%', boxShadow: `0 0 20px 5px ${color}` }}
        >
            <LucideGamepad2 className="absolute inset-0 w-full h-full p-2 text-white/70" />
        </div>
    );
});
Player.displayName = 'Player';

/**
 * Renders a single Obstacle wall.
 */
const ObstacleComponent: React.FC<{ obstacle: Obstacle }> = React.memo(({ obstacle }) => {
    const laneMap = {
        left: 'left-0',
        center: 'left-1/3',
        right: 'left-2/3',
    };
    
    // Convert 0-100 Y-position to a CSS transform for smooth animation
    const yTransform = `translateY(${obstacle.y}vh)`;
    
    return (
        <div
            className={`absolute ${laneMap[obstacle.lane]} ${LANE_WIDTH_CLASS} `}
            style={{ 
                top: 0, 
                height: `${obstacle.height}vh`, 
                backgroundColor: obstacle.requiredColor,
                transform: yTransform,
                boxShadow: `0 0 10px ${obstacle.requiredColor}`
            }}
        />
    );
});
ObstacleComponent.displayName = 'ObstacleComponent';


/**
 * Renders the color control buttons.
 */
const ColorControls: React.FC<{ gameState: GameState, setPlayerColor: (index: number) => void }> = ({ gameState, setPlayerColor }) => {
    return (
        <div className="flex justify-center p-4 space-x-2">
            {COLORS.map((color, index) => (
                <button
                    key={index}
                    onClick={() => setPlayerColor(index)}
                    disabled={gameState.isGameOver}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-100 ease-in-out ${
                        gameState.playerColorIndex === index
                            ? 'scale-125 border-teal-500 shadow-lg ring-4 ring-teal-500/50'
                            : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${index + 1}`}
                />
            ))}
        </div>
    );
};

// --- 5. MAIN GAME COMPONENT ---

export default function ColorChromaGauntlet() {
    const router = useRouter(); // Initialize router
    
    const [gameState, setGameState] = useState<GameState>({
        playerColorIndex: 0,
        isGameOver: false,
        score: 0,
        gameSpeed: START_SPEED,
    });
    const [playerLane, setPlayerLane] = useState<Lane>('center');
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);

    // REFS to hold the LATEST state for use inside the game loop
    const gameRef = useRef<number | null>(null);
    const lastObstacleTimeRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    
    const stateRef = useRef(gameState);
    const laneRef = useRef(playerLane);
    const obstaclesRef = useRef(obstacles);

    // Synchronize state into refs
    useEffect(() => { stateRef.current = gameState; }, [gameState]);
    useEffect(() => { laneRef.current = playerLane; }, [playerLane]);
    useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);

    const setPlayerColor = useCallback((index: number) => {
        setGameState(prev => ({ ...prev, playerColorIndex: index }));
    }, []);
    
    // Function to navigate back (Matching the reference structure)
    const handleBack = () => {
        router.push("/games"); 
    }
    
    // --- Game Loop Implementation (requestAnimationFrame) ---
    const gameLoop = useCallback((currentTime: number) => {
        
        // ACCESS LATEST STATE VIA REFS
        const currentState = stateRef.current;
        const currentLane = laneRef.current;
        const currentObstacles = obstaclesRef.current;

        if (currentState.isGameOver) {
            if(gameRef.current) cancelAnimationFrame(gameRef.current);
            return;
        }

        // Determine deltaTime for frame-rate independent movement
        const deltaTime = currentTime - lastUpdateTimeRef.current;
        
        if (lastUpdateTimeRef.current === 0) {
            lastUpdateTimeRef.current = currentTime;
            const initialDelay = 1000;
            lastObstacleTimeRef.current = currentTime - 2000 + initialDelay; 
            gameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const deltaSeconds = deltaTime / 1000;
        lastUpdateTimeRef.current = currentTime;

        let newObstacles = [...currentObstacles];
        let newScore = currentState.score;
        // let newSpeed = currentState.gameSpeed; // Not used directly here
        
        // 1. Move existing obstacles
        newObstacles = newObstacles.map(obs => {
            // Speed calculation moved outside map for clarity/performance
            const moveAmount = currentState.gameSpeed * 60 * deltaSeconds; 
            return { ...obs, y: obs.y + moveAmount };
        });

        // 2. Filter out obstacles that have passed the player and update score
        const activeObstacles = newObstacles.filter(obs => obs.y < 100);
        newScore += newObstacles.length - activeObstacles.length; 
        
        // 3. Generate new obstacles
        const obstacleGap = 2000 / currentState.gameSpeed; 
        
        if (currentTime - lastObstacleTimeRef.current > obstacleGap) {
            activeObstacles.push(generateObstacle(activeObstacles[activeObstacles.length - 1]));
            lastObstacleTimeRef.current = currentTime;
        }

        // 4. Check Collision
        if (checkCollision(currentState, currentLane, activeObstacles)) {
            setGameState(prev => ({ ...prev, isGameOver: true })); 
            return;
        }

        // 5. Update State and Speed
        setObstacles(activeObstacles); 
        setGameState(prev => ({
            ...prev,
            score: newScore,
            // Increase speed slightly over time
            gameSpeed: Math.min(prev.gameSpeed + (0.005 * deltaSeconds), 2.5) 
        }));

        // 6. Loop
        gameRef.current = requestAnimationFrame(gameLoop);

    }, []); // EMPTY DEPENDENCY ARRAY - DO NOT ADD DEPENDENCIES HERE

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

    // --- Effect Hooks ---

    // 1. Initial Start and Loop Control
    useEffect(() => {
        resetGame(); 

        return () => {
            if (gameRef.current) cancelAnimationFrame(gameRef.current);
        };
    }, [resetGame]);

    // 2. Keyboard Input Handling
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (gameState.isGameOver) {
                if (event.key === 'Enter') resetGame();
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    setPlayerLane(prevLane => {
                        if (prevLane === 'center') return 'left';
                        if (prevLane === 'right') return 'center';
                        return 'left'; 
                    });
                    break;
                case 'ArrowRight':
                    setPlayerLane(prevLane => {
                        if (prevLane === 'center') return 'right';
                        if (prevLane === 'left') return 'center';
                        return 'right'; 
                    });
                    break;
                // Use 1-5 keys to instantly set color
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    const index = parseInt(event.key) - 1;
                    if (index >= 0 && index < COLORS.length) {
                        setPlayerColor(index);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState.isGameOver, setPlayerColor, resetGame]);


    // Determine the current player color
    const playerColor = COLORS[gameState.playerColorIndex];

    return (
        // Removed bg-gray-900 for transparent background
        <div className="min-h-screen text-gray-900 flex flex-col items-center p-4">
            
            {/* Back button - MATCHING REFERENCE STYLE */}
            <div className="fixed top-6 left-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm font-medium border border-gray-300 rounded-lg px-3 py-1 bg-transparent hover:bg-gray-100 transition"
                >
                    <LucideArrowLeft className="w-4 h-4" />
                    Back to Games
                </button>
            </div>
            
            <main className="flex flex-col items-center justify-center pt-20 pb-12 w-full">
                
                <div className="w-full max-w-md">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center text-teal-600 mb-4">
                        Color Chroma Gauntlet
                    </h1>
                    <div className="flex justify-center mb-6">
                        <span className="inline-flex items-center gap-2 text-sm font-medium border border-gray-300 rounded-full px-4 py-1.5">
                            <span>Score</span>
                            <span className="font-semibold text-yellow-600">{gameState.score}</span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm font-medium border border-gray-300 rounded-full px-4 py-1.5 ml-3">
                            <span>Speed</span>
                            <span className="font-semibold text-pink-600">{gameState.gameSpeed.toFixed(2)}x</span>
                        </span>
                    </div>
                </div>

                {/* Game Area Container */}
                <div className="relative w-full max-w-md h-[70vh] min-h-[400px] overflow-hidden bg-white border-4 border-gray-300 rounded-xl shadow-lg">
                    {/* Visual Lane Markers */}
                    <div className="absolute inset-0 flex">
                        <div className={`${LANE_WIDTH_CLASS} border-r border-gray-200`} />
                        <div className={`${LANE_WIDTH_CLASS} border-r border-gray-200`} />
                        <div className={`${LANE_WIDTH_CLASS}`} />
                    </div>

                    {/* Obstacles */}
                    {obstacles.map(obs => (
                        <ObstacleComponent key={obs.id} obstacle={obs} />
                    ))}

                    {/* Player */}
                    <Player color={playerColor} lane={playerLane} />

                    {/* Collision Line Marker */}
                    <div className="absolute inset-x-0 bg-red-500/50 h-[2px] opacity-50" style={{ top: `${PLAYER_COLLISION_LINE_Y}vh` }} />

                    {/* Game Over Modal */}
                    {gameState.isGameOver && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                            <h2 className="text-6xl font-black text-red-600 mb-4 animate-bounce">GAME OVER</h2>
                            <p className="text-2xl mb-6 text-gray-800">Final Score: <span className="text-yellow-600 font-bold">{gameState.score}</span></p>
                            <button 
                                onClick={resetGame} 
                                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg transition shadow-xl flex items-center space-x-2"
                            >
                                <LucideRedo className="w-5 h-5" />
                                <span>Restart (Enter)</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Controls and Instructions */}
                <div className="w-full max-w-md mt-6">
                    <p className="text-center text-gray-500 mb-4 text-sm">
                        Use **Arrow Keys** to change lane. Use **1-5** keys to change color.
                    </p>
                    <ColorControls gameState={gameState} setPlayerColor={setPlayerColor} />
                </div>
            </main>
        </div>
    );
}