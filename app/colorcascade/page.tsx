"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';

// --- GLOBAL TYPE DECLARATIONS ---
declare const __app_id: string | undefined;

// --- CONSTANTS & CONFIGURATION ---

const GRID_SIZE = 18; // Adjusted grid size to 18x18
const TILE_SIZE = 40; // Max tile size for easy dragging
const NUM_PATTERNS = 3;

// Game Colors (Simplified to RGB spectrum colors)
const GAME_COLORS = {
    'red': '#FF4545',    // Red
    'green': '#4CAF50',  // Green
    'blue': '#2196F3',   // Blue
    'yellow': '#FFEB3B', // Yellow
    'cyan': '#00BCD4',   // Cyan
    'purple': '#9C27B0', // Magenta:Violet
    'orange': '#FF9800'  // Orange
};

// --- TYPE DEFINITIONS ---

type ColorKey = keyof typeof GAME_COLORS;
type Grid = (ColorKey | null)[][]; // The main 18x18 board
type Tile = {
    id: number;
    colorMap: Map<string, ColorKey>; // Maps coordinate string "r,c" to ColorKey
    shape: [number, number][]; // Relative coordinates [row, col]
    used: boolean;
    color: ColorKey; // FIX: Re-added the 'color' property to satisfy type checker
};
type TileSet = Tile[];

// --- UTILITIES ---

const getRandomColor = (exclude: ColorKey | null = null): ColorKey => {
    const colorKeys = Object.keys(GAME_COLORS) as ColorKey[];
    let color: ColorKey;
    do {
        color = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    } while (color === exclude);
    return color;
};

/**
 * Generates a set of random, contiguous tiles (pieces) with a max size of 4 blocks.
 * Colors are mixed to ensure no piece contains more than 2 contiguous blocks of the same color.
 */
const generateRandomTileSet = (initialId: number): TileSet => {
    // Shapes are max 4 blocks and guaranteed safe (no 3+ inline blocks)
    const safeShapes: [number, number][][] = [
        [[0, 0]],                                        // 1-block
        [[0, 0], [0, 1]],                                // 2-block Horizontal
        [[0, 0], [1, 0]],                                // 2-block Vertical
        [[0, 0], [1, 0], [0, 1]],                        // 3-block L
        [[0, 0], [0, 1], [1, 1]],                        // 3-block L rotated
        [[0, 1], [1, 0], [1, 1]],                        // 3-block T
        [[0, 0], [0, 1], [1, 0], [1, 1]],                // 4-block 2x2 Square
        [[0, 0], [0, 1], [1, 1], [1, 2]],                // 4-block Z
        [[0, 1], [1, 0], [1, 1], [2, 1]],                // 4-block T
        [[0, 0], [1, 0], [1, 1], [2, 1]],                // 4-block S
    ];

    const tileSet: TileSet = [];

    for (let i = 0; i < NUM_PATTERNS; i++) {
        const shape = safeShapes[Math.floor(Math.random() * safeShapes.length)];
        const colorMap: Map<string, ColorKey> = new Map();
        
        // Use a temporary grid to check for match-3 safety *during* color assignment
        const tempGrid: (ColorKey | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));
        const [minR, minC] = shape.reduce(([minR, minC], [r, c]) => 
            [Math.min(minR, r), Math.min(minC, c)], [Infinity, Infinity]);
        
        // Sort shape to ensure adjacent blocks are colored sequentially (more stable randomization)
        const sortedShape = [...shape].sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
        
        sortedShape.forEach(([r, c]) => {
            let placed = false;
            let attempts = 0;
            
            // Relative coordinates for the temp grid
            const tr = r - minR;
            const tc = c - minC;
            
            while (!placed && attempts < 20) {
                attempts++;
                const newColor = getRandomColor();
                
                let createsMatch3 = false;
                
                // --- Match-3 safety check relative to the temporary piece grid ---
                
                // Horizontal check: (X-2, X-1, C) or (X-1, C, X+1) or (C, X+1, X+2)
                if (tempGrid[tr]?.[tc - 1] === newColor && tempGrid[tr]?.[tc - 2] === newColor) createsMatch3 = true;
                if (tempGrid[tr]?.[tc + 1] === newColor && tempGrid[tr]?.[tc + 2] === newColor) createsMatch3 = true;
                if (tempGrid[tr]?.[tc - 1] === newColor && tempGrid[tr]?.[tc + 1] === newColor) createsMatch3 = true;
                
                // Vertical check
                if (tempGrid[tr - 1]?.[tc] === newColor && tempGrid[tr - 2]?.[tc] === newColor) createsMatch3 = true;
                if (tempGrid[tr + 1]?.[tc] === newColor && tempGrid[tr + 2]?.[tc] === newColor) createsMatch3 = true;
                if (tempGrid[tr - 1]?.[tc] === newColor && tempGrid[tr + 1]?.[tc] === newColor) createsMatch3 = true;

                if (!createsMatch3) {
                    // Place the color in the temp grid and map
                    tempGrid[tr][tc] = newColor;
                    colorMap.set(`${r},${c}`, newColor);
                    placed = true;
                }
            }
            // Fallback for safety (should rarely hit this with 20 attempts)
            if (!placed) {
                // Force a different color if necessary
                const safeColor = getRandomColor(tempGrid[tr][tc - 1] || tempGrid[tr - 1][tc]);
                colorMap.set(`${r},${c}`, safeColor);
            }
        });

        // The 'color' property is now the color of the first block for legacy type compatibility, 
        // but the actual colors are in colorMap.
        const defaultColor = colorMap.values().next().value as ColorKey || getRandomColor();

        tileSet.push({
            id: initialId + i,
            colorMap: colorMap,
            color: defaultColor, 
            shape: shape,
            used: false,
        });
    }
    return tileSet;
};

/**
 * Finds groups of 3 or more adjacent (orthogonally connected) tiles of the same color.
 * Uses a modified Breadth-First Search (BFS) approach.
 */
const findGroupMatches = (grid: Grid): [number, number][] => {
    const rows = grid.length;
    const cols = grid[0].length;
    const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const finalTilesToClear: Set<string> = new Set();
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // Right, Left, Down, Up

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const color = grid[r][c];
            if (!color || visited[r][c]) continue;

            const currentCluster: [number, number][] = [];
            const queue: [number, number][] = [[r, c]];
            visited[r][c] = true;

            let head = 0;
            while (head < queue.length) {
                const [cr, cc] = queue[head++];
                currentCluster.push([cr, cc]);

                for (const [dr, dc] of directions) {
                    const nr = cr + dr;
                    const nc = cc + dc;

                    if (
                        nr >= 0 && nr < rows &&
                        nc >= 0 && nc < cols &&
                        !visited[nr][nc] &&
                        grid[nr][nc] === color
                    ) {
                        visited[nr][nc] = true;
                        queue.push([nr, nc]);
                    }
                }
            }
            
            // Check if the found cluster is large enough to blast
            if (currentCluster.length >= 3) {
                currentCluster.forEach(([cr, cc]) => finalTilesToClear.add(`${cr},${cc}`));
            }
        }
    }
    
    // Convert Set<string> back to [number, number][] array
    return Array.from(finalTilesToClear).map(coordStr => {
        const [r, c] = coordStr.split(',').map(Number);
        return [r, c] as [number, number];
    });
};


/**
 * Applies the clears to the grid and returns the new grid and score.
 */
const clearMatches = (grid: Grid, coordsToClear: [number, number][]): { newGrid: Grid, scoreDelta: number } => {
    let scoreDelta = 0;
    const newGrid = grid.map(row => [...row]); // Deep copy

    coordsToClear.forEach(([r, c]) => {
        if (newGrid[r][c]) {
            newGrid[r][c] = null;
            // SCORE UPDATE: 1 point per cleared block
            scoreDelta += 1; 
        }
    });

    return { newGrid, scoreDelta };
};


// --- COMPONENT: Tile Display ---

/**
 * Renders the preview of a single draggable tile.
 */
const TilePreview: React.FC<{
    tile: Tile;
    scale?: number;
    draggable: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, tile: Tile) => void;
}> = ({ tile, scale = 1, draggable, onDragStart }) => {
    // Calculate bounding box for the piece
    const minR = Math.min(...tile.shape.map(s => s[0]));
    const minC = Math.min(...tile.shape.map(s => s[1]));
    const tileW = Math.max(...tile.shape.map(s => s[1])) - minC + 1;
    const tileH = Math.max(...tile.shape.map(s => s[0])) - minR + 1;

    // Determine preview style based on used state
    const opacity = tile.used ? 0.3 : 1;
    const cursor = tile.used ? 'cursor-default' : 'cursor-grab';
    const dragProps = draggable && !tile.used ? { draggable: true, onDragStart: (e: React.DragEvent<HTMLDivElement>) => onDragStart(e, tile) } : {};

    return (
        <div
            className={`p-2 rounded-lg transition-opacity duration-300 ${cursor}`}
            style={{ 
                opacity, 
                width: `${tileW * TILE_SIZE * scale}px`, 
                height: `${tileH * TILE_SIZE * scale}px`,
            }}
            {...dragProps}
        >
            <div 
                className="grid"
                style={{
                    gridTemplateColumns: `repeat(${tileW}, ${TILE_SIZE * scale}px)`,
                    gridTemplateRows: `repeat(${tileH}, ${TILE_SIZE * scale}px)`,
                }}
            >
                {tile.shape.map(([r, c], index) => {
                    // Get the color for the specific block using its relative coordinates
                    // FIX: Ensure colorKey is correctly typed as ColorKey
                    const colorKey = tile.colorMap.get(`${r},${c}`) || tile.color; 
                    
                    return (
                        <div
                            key={index}
                            className="rounded-md shadow-md border-2 border-white transition-transform duration-100"
                            style={{
                                // Adjust grid area based on minimum coordinates to ensure piece starts at top-left of its container
                                gridArea: `${r - minR + 1} / ${c - minC + 1} / span 1 / span 1`, 
                                backgroundColor: GAME_COLORS[colorKey],
                                width: `${TILE_SIZE * scale}px`,
                                height: `${TILE_SIZE * scale}px`,
                                transform: 'scale(0.95)'
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};


// --- COMPONENT: Main Game Grid ---

const MainGrid: React.FC<{
    grid: Grid;
    onDrop: (e: React.DragEvent<HTMLDivElement>, r: number, c: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, r: number, c: number) => void;
    highlightCells: [number, number][]; // Cells to highlight during drag
    placementIsValid: boolean | null; // NEW: Validity state for drag highlight
    matchCells: [number, number][]; // Cells to highlight for clearing
}> = ({ grid, onDrop, onDragOver, highlightCells, placementIsValid, matchCells }) => {
    
    // Convert highlight and match cells to Set<string> for fast lookup
    const highlightSet = useMemo(() => new Set(highlightCells.map(([r, c]) => `${r},${c}`)), [highlightCells]);
    const matchSet = useMemo(() => new Set(matchCells.map(([r, c]) => `${r},${c}`)), [matchCells]);

    // Determine the border color for placement highlight
    const highlightRingColor = placementIsValid === true
        ? 'ring-green-500' // Valid placement: GREEN
        : placementIsValid === false
        ? 'ring-red-500'   // Invalid placement: RED
        : 'ring-blue-500'; // Default/unused state (shouldn't happen during drag)

    const highlightBgColor = placementIsValid === true 
        ? 'bg-green-100/70' 
        : 'bg-red-100/70';

    return (
        <div className="shadow-2xl rounded-xl border-4 border-gray-700/50 p-1 bg-gray-900/10">
            <div
                className="grid mx-auto"
                style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    width: `${GRID_SIZE * TILE_SIZE}px`,
                    height: `${GRID_SIZE * TILE_SIZE}px`,
                }}
            >
                {grid.map((row, r) =>
                    row.map((colorKey, c) => {
                        const cellId = `${r},${c}`;
                        const isHighlighted = highlightSet.has(cellId);
                        const isMatch = matchSet.has(cellId);

                        // FIX: Ensure colorKey is treated as ColorKey for indexing GAME_COLORS
                        let backgroundColor = colorKey ? GAME_COLORS[colorKey as ColorKey] : '#E0E0E0';
                        
                        let className = "relative transition-all duration-200 border border-gray-300/50 rounded-sm";
                        let transformStyle = '';

                        if (isHighlighted) {
                            // Apply dynamic style for drag-over placement preview
                            className += ` ring-2 ring-offset-1 ${highlightRingColor} ${highlightBgColor} opacity-80`;
                        }
                        
                        if (isMatch) {
                            // Style for clearing match (pulsing effect)
                            className += ' animate-pulse';
                            // Override background color for intense visual effect
                            backgroundColor = 'rgba(255, 69, 0, 0.9)'; // OrangeRed blast
                            transformStyle = 'scale(1.05)';
                        }
                        
                        // Style for empty slots
                        if (!colorKey && !isHighlighted && !isMatch) {
                            backgroundColor = 'rgba(240, 240, 240, 0.9)'; // Light, visible empty slot
                            className += ' hover:bg-gray-200';
                        }


                        return (
                            <div
                                key={`${r}-${c}`}
                                className={className}
                                style={{
                                    backgroundColor,
                                    transform: transformStyle,
                                }}
                                onDragOver={(e) => onDragOver(e, r, c)}
                                onDrop={(e) => onDrop(e, r, c)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    // Game State
    const initialGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const [grid, setGrid] = useState<Grid>(initialGrid);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [tileSet, setTileSet] = useState<TileSet>(generateRandomTileSet(0));
    const [isGameOver, setIsGameOver] = useState(false);
    const [tileIdCounter, setTileIdCounter] = useState(NUM_PATTERNS); // Used for unique tile IDs

    // Drag State
    const [draggedTile, setDraggedTile] = useState<Tile | null>(null);
    const [highlightCells, setHighlightCells] = useState<[number, number][]>([]);
    const [placementIsValid, setPlacementIsValid] = useState<boolean | null>(null); // NEW: State to track validity
    
    // Match State (for visual feedback)
    const [matchCells, setMatchCells] = useState<[number, number][]>([]);

    // --- GAME START/RESET ---

    useEffect(() => {
        // Load high score from local storage (or Firestore in a full app)
        const savedHighScore = localStorage.getItem('hexaMatchHighScore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore));
        }
    }, []);

    const resetGame = useCallback(() => {
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
        setScore(0);
        setTileSet(generateRandomTileSet(0));
        setTileIdCounter(NUM_PATTERNS);
        setIsGameOver(false);
        setMatchCells([]);
        setHighlightCells([]);
        setPlacementIsValid(null);
    }, []);

    // --- DRAG LOGIC ---

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tile: Tile) => {
        setDraggedTile(tile);
        setPlacementIsValid(null); // Reset validity state on drag start
        // Set drag image data, though often not perfectly visible in browser environments
        e.dataTransfer.setData("text/plain", tile.id.toString());
        
        // Optional: Hide drag image preview (sometimes necessary for cleaner look)
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        
        // Fix: Explicitly set drop effect
        e.dataTransfer.dropEffect = 'move';
    };
    
    /**
     * Checks if a tile can be placed at the given root (r, c)
     */
    const isValidPlacement = useCallback((tile: Tile, rootR: number, rootC: number): boolean => {
        if (!tile || tile.used) return false;

        for (const [dr, dc] of tile.shape) {
            const r = rootR + dr;
            const c = rootC + dc;

            // Check boundaries
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
                return false;
            }
            // Check if cell is already occupied
            if (grid[r][c] !== null) {
                return false;
            }
        }
        return true;
    }, [grid]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, r: number, c: number) => {
        e.preventDefault();
        if (!draggedTile) return;

        // 1. Check placement validity
        const placementIsValid = isValidPlacement(draggedTile, r, c);
        setPlacementIsValid(placementIsValid);

        // 2. Determine highlighting cells
        const newHighlightCells: [number, number][] = [];
        if (placementIsValid) {
            for (const [dr, dc] of draggedTile.shape) {
                newHighlightCells.push([r + dr, c + dc]);
            }
        }
        
        // Update highlight state only if it changed to avoid excessive re-renders
        if (JSON.stringify(newHighlightCells) !== JSON.stringify(highlightCells)) {
            setHighlightCells(newHighlightCells);
        }

        // 3. Use the validity check to set the drag cursor style
        e.dataTransfer.dropEffect = placementIsValid ? 'move' : 'none';
    }, [draggedTile, highlightCells, isValidPlacement]);
    
    const handleDragEnd = () => {
        setDraggedTile(null); // Critical: Ensure drag state is cleared
        setHighlightCells([]);
        setPlacementIsValid(null); // Clear validity state
    }

    // --- GAMEPLAY LOGIC ---
    
    const applyPlacement = useCallback(async (tile: Tile, rootR: number, rootC: number) => {
        let newGrid = grid.map(row => [...row]); // Deep copy of the grid
        // Start score delta at 0, no longer awarding points just for placement
        let scoreDelta = 0; 

        // 1. Place the tiles
        for (const [dr, dc] of tile.shape) {
            const r = rootR + dr;
            const c = rootC + dc;
            // Place the color based on the individual block's color in the map
            const colorKey = tile.colorMap.get(`${dr},${dc}`) || tile.color; 
            newGrid[r][c] = colorKey;
        }

        // 2. Mark the tile as used
        const newTileSet = tileSet.map(t => 
            t.id === tile.id ? { ...t, used: true } : t
        );
        
        setTileSet(newTileSet);
        
        // 3. Recursive Match/Clear loop
        let currentGrid = newGrid;
        let totalScoreDelta = scoreDelta;

        const loop = (currentGrid: Grid): Grid => {
            // NOTE: Using the new findGroupMatches logic
            const matches = findGroupMatches(currentGrid);
            if (matches.length === 0) {
                return currentGrid;
            }

            // Temporarily highlight matches for visual feedback
            setMatchCells(matches);
            
            // Clear matches and update score
            const { newGrid: clearedGrid, scoreDelta: clearScore } = clearMatches(currentGrid, matches);
            // Accumulate score based ONLY on the number of eliminated blocks
            totalScoreDelta += clearScore; 
            
            // Set matchCells to empty *after* clearing to ensure visual reset for cascading match
            setTimeout(() => setMatchCells([]), 300); 

            // Re-check for new matches created by the clearance (cascading effect)
            return loop(clearedGrid); 
        };
        
        const finalGrid = loop(newGrid);
        
        setGrid(finalGrid);
        
        // 4. Update Score
        const newScore = score + totalScoreDelta;
        setScore(newScore);
        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('hexaMatchHighScore', newScore.toString());
        }

        // 5. Check for new tile generation and Game Over
        const allUsed = newTileSet.every(t => t.used);
        if (allUsed) {
            // Generate next set
            const nextTileSet = generateRandomTileSet(tileIdCounter);
            setTileSet(nextTileSet);
            setTileIdCounter(prev => prev + NUM_PATTERNS);
            
            // Check for Game Over after new tiles are generated
            checkGameOver(finalGrid, nextTileSet);
        } else {
            // Check for Game Over only if the player is stuck with the remaining tiles
            checkGameOver(finalGrid, newTileSet);
        }
        
    }, [grid, score, highScore, tileSet]);


    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, r: number, c: number) => {
        e.preventDefault();
        const droppedTile = draggedTile; // Use the state set during dragStart
        setDraggedTile(null); // Clear drag state
        setHighlightCells([]); // Clear visual preview
        setPlacementIsValid(null); // Clear validity state

        if (droppedTile && isValidPlacement(droppedTile, r, c)) {
            applyPlacement(droppedTile, r, c);
        }
    }, [draggedTile, isValidPlacement, applyPlacement]);

    
    /**
     * Checks if any remaining unused tile can be placed anywhere on the grid.
     */
    const checkGameOver = useCallback((currentGrid: Grid, currentTileSet: TileSet) => {
        // Filter out used tiles
        const remainingTiles = currentTileSet.filter(t => !t.used);
        
        // If all tiles are used, we rely on the logic in applyPlacement to generate a new set and check immediately after.
        if (remainingTiles.length === 0 && currentTileSet.length === NUM_PATTERNS && currentTileSet.every(t => !t.used)) {
             // This is the check for a newly generated set that immediately results in Game Over
             if (!remainingTiles.length) {
                // If the new set is generated, remainingTiles will be 3, but their `used` status is false.
                // We check the new set against the current board.
                remainingTiles.push(...currentTileSet);
             }
        }
        
        if (remainingTiles.length === 0) return; // Wait for new set to generate

        let canPlaceAnyTile = false;

        for (const tile of remainingTiles) {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (isValidPlacement(tile, r, c)) {
                        canPlaceAnyTile = true;
                        break;
                    }
                }
                if (canPlaceAnyTile) break;
            }
            if (canPlaceAnyTile) break;
        }

        if (!canPlaceAnyTile) {
            setIsGameOver(true);
        }
    }, [isValidPlacement]);


    // Effect to check for game over whenever tileset or grid changes
    useEffect(() => {
        if (!isGameOver && tileSet.length > 0) {
            // Only perform game over check when the user interacts or a new set is generated
            checkGameOver(grid, tileSet);
        }
    }, [tileSet, grid, isGameOver, checkGameOver]);
    

    // --- RENDER ---

    return (
        <div className="min-h-screen p-6 font-sans flex flex-col items-center">
            
            {/* Header and Scoreboard */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 p-4 bg-white rounded-xl shadow-2xl border-b-4 border-indigo-400">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-wide">
                    Color Cascade
                </h1>
                
                <div className="flex items-center space-x-6 text-center">
                    {/* Home Button */}
                    <a 
                        href="/" /* Simulates navigation to the home path */
                        className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors shadow-md hover:shadow-lg"
                        aria-label="Go to Home"
                    >
                        {/* New Home SVG Icon */}
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                    </a>

                    <div>
                        <p className="text-sm font-medium text-gray-500">SCORE</p>
                        <p className="text-3xl font-bold text-green-600">{score}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">HIGH SCORE</p>
                        <p className="text-3xl font-bold text-red-600">{highScore}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row w-full max-w-6xl space-y-8 lg:space-y-0 lg:space-x-8 justify-center">
                
                {/* Main Game Grid */}
                <div className="flex-shrink-0">
                    <MainGrid
                        grid={grid}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        highlightCells={highlightCells}
                        matchCells={matchCells}
                        placementIsValid={placementIsValid} /* Passed validity state */
                    />
                </div>
                
                {/* Tile Palette / Controls */}
                <div className="w-full lg:w-80 flex flex-col space-y-6"> 
                    <div className="p-6 bg-white rounded-xl shadow-xl border-2 border-gray-200 w-full">
                        <p className="text-lg font-semibold text-gray-700 mb-3 text-center border-b pb-2">Drag & Drop</p>
                        <div 
                            className="flex flex-col items-center justify-around space-y-8" 
                            onDragEnd={handleDragEnd}
                        >
                            {tileSet.map((tile) => (
                                <TilePreview
                                    key={tile.id}
                                    tile={tile}
                                    draggable={true}
                                    onDragStart={handleDragStart}
                                    scale={1.3} /* Increased scale for larger drag target */
                                />
                            ))}
                        </div>
                    </div>
                    
                    {/* Reset Button */}
                    <button
                        onClick={resetGame}
                        className="w-full py-3 text-lg font-semibold rounded-xl bg-indigo-500 text-white shadow-lg transition-all transform hover:scale-[1.03] active:scale-[0.98] hover:bg-indigo-600 shadow-indigo-500/50"
                    >
                        New Game
                    </button>
                </div>
            </div>
            
            {/* Game Over Modal - Enhanced for clarity and restart */}
            {isGameOver && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-3xl p-10 w-full max-w-md text-center border-8 border-red-500 transform scale-105 animate-pulse-once">
                        <h2 className="text-5xl font-extrabold text-red-600 mb-2 tracking-wider">GAME OVER!</h2>
                        <svg className="w-16 h-16 mx-auto my-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <p className="text-2xl text-gray-800 mb-6 font-semibold">
                            Final Score: <span className="font-extrabold text-red-600">{score}</span>
                        </p>
                        <p className="text-lg text-gray-600 mb-8">
                            High Score: {highScore}
                        </p>
                        <button
                            onClick={resetGame}
                            className="w-full py-4 text-xl font-bold rounded-xl bg-green-500 text-white shadow-2xl transition-all hover:bg-green-600 transform hover:scale-[1.02]"
                        >
                            <svg className="w-6 h-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5m-1.5-9h-10A1.5 1.5 0 005 6.5v11A1.5 1.5 0 006.5 19h11a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0017.5 4h-10" />
                            </svg>
                            Restart Game
                        </button>
                        <a 
                            href="/" 
                            className="block mt-4 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                            Go to Home (/)
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;