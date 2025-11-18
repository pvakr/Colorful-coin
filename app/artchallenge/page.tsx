"use client";

import React, { useState, useMemo, useCallback } from 'react';

// --- GLOBAL TYPE DECLARATIONS ---
// Fixes TypeScript error for Canvas environment variable
declare const __app_id: string | undefined;

// --- TYPE DEFINITIONS (Implementing TypeScript logic) ---
// selectedColor can now be a color key string OR the specific 'ERASER' key
type ColorMap = { [key: string]: string };
type UserGrid = { [key: string]: string | undefined };
type TargetPattern = { [key: string]: string };
type Level = {
    id: number;
    title: string;
    complexity: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
    pattern: TargetPattern;
};
type GameMode = 'selection' | 'playing';
type ModalState = {
    isOpen: boolean;
    isSuccess: boolean;
    title: string;
    message: string;
};

// --- CONSTANTS ---

const COLORS: ColorMap = {
  'red': '#FF4545',
  'orange': '#FFA500',
  'purple': '#800080',
  'green': '#008000',
  'pink': '#FFC0CB',
  'blue': '#0070FF',
  'cyan': '#00FFFF',
  'yellow': '#FFFF00',
};

const ERASER_KEY = 'ERASER'; // Unique key for the eraser tool

const HEX_SIZE = 20; // Size of the hexagon in pixels
const NUM_ROWS = 15;
const NUM_COLS = 10;
const HEX_W = HEX_SIZE * Math.sqrt(3);
const HEX_H_SEP = HEX_SIZE * 1.5;

// Calculated dimensions for a tight fit based on grid geometry (to eliminate padding)
// Width: Approx 357 (covers the max X extent of the last hex, index 9, on an odd row)
const CANVAS_WIDTH = 357; 
// Height: Max Y extent of the last hex (index 14) which is (14 * 30) + 20 (radius) + 10 (offset) = 450
const CANVAS_HEIGHT = 450; 

// --- UTILITY: Pattern Definitions (20 Total) ---

// Existing Levels (Categorized)
const createDiamond = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 5; r <= 9; r++) {
        const centerCol = 5;
        const width = 5 - Math.abs(r - 7);
        for (let c = centerCol - Math.floor(width / 2); c < centerCol + Math.ceil(width / 2); c++) {
            pattern[`r${r}c${c}`] = 'blue';
        }
    }
    return pattern;
};

const createArrowhead = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const centerCol = 5;
    for (let r = 2; r < 13; r++) {
        const width = Math.min(r - 2, 12 - r) + 1;
        for (let c = centerCol - Math.floor(width / 2); c < centerCol + Math.ceil(width / 2); c++) {
            if (r > 6 && r < 11) {
                pattern[`r${r}c${c}`] = 'orange';
            } else if (r <= 6) {
                pattern[`r${r}c${c}`] = 'red';
            }
        }
    }
    return pattern;
};

const createGnome = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r <= 6; r++) {
        for (let c = 4 - Math.floor(r / 2); c <= 6 + Math.floor(r / 2); c++) {
            if (r > 0 && r < 7) {
                pattern[`r${r}c${c}`] = 'red';
            }
        }
    }
    for (let r = 7; r <= 9; r++) {
        for (let c = 3; c <= 7; c++) {
            pattern[`r${r}c${c}`] = 'orange';
        }
    }
    for (let r = 10; r <= 11; r++) {
        for (let c = 2; c <= 8; c++) {
            pattern[`r${r}c${c}`] = 'green';
        }
    }
    pattern['r8c5'] = 'purple';
    pattern['r8c4'] = 'pink';
    pattern['r8c6'] = 'pink';
    delete pattern['r1c5'];
    delete pattern['r2c5'];
    return pattern;
};

const createHollowHeart = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const cells = [
      'r6c3', 'r6c4', 'r6c6', 'r6c7', 
      'r7c2', 'r7c5', 'r7c8', 
      'r8c3', 'r8c7', 
      'r9c4', 'r9c6', 
      'r10c5',
    ];
    cells.forEach(id => pattern[id] = 'red');
    return pattern;
};

const createCheckerboard = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            if ((r + c) % 2 === 0) {
                pattern[`r${r}c${c}`] = 'cyan';
            } else {
                pattern[`r${r}c${c}`] = 'yellow';
            }
        }
    }
    return pattern;
};

const createTree = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 10; r < 13; r++) {
        pattern[`r${r}c${5}`] = 'orange';
    }
    for (let r = 3; r < 10; r++) {
        const centerCol = 5;
        const width = 9 - Math.floor(r / 2);
        for (let c = centerCol - Math.floor(width / 2); c < centerCol + Math.ceil(width / 2); c++) {
            if (r % 2 === 1 || c !== 5) {
                 pattern[`r${r}c${c}`] = 'green';
            }
        }
    }
    pattern['r2c5'] = 'yellow';
    return pattern;
};

const createButterfly = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 4; r < 12; r++) {
        for (let c = 1; c < 5; c++) {
            if ((r === 4 && c < 4) || (r === 11 && c < 4) || (c === 1 && r > 4 && r < 11) || (c === 4 && r > 4 && r < 11)) {
                 pattern[`r${r}c${c}`] = 'blue';
            }
        }
    }
    for (let r = 4; r < 12; r++) {
        for (let c = 5; c < 9; c++) {
            if ((r === 4 && c > 5) || (r === 11 && c > 5) || (c === 8 && r > 4 && r < 11) || (c === 5 && r > 4 && r < 11)) {
                 pattern[`r${r}c${c}`] = 'purple';
            }
        }
    }
    for (let r = 4; r < 12; r++) {
        pattern[`r${r}c${4}`] = 'pink';
        pattern[`r${r}c${5}`] = 'pink';
    }
    pattern['r7c5'] = 'red';
    pattern['r8c4'] = 'red';
    return pattern;
};

const createCrossHatch = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            if ((r - c) % 3 === 0) {
                pattern[`r${r}c${c}`] = 'red';
            }
            const sum = r + c;
            if (sum % 4 === 0) {
                 pattern[`r${r}c${c}`] = 'green';
            }
        }
    }
    return pattern;
};

const createComplexSpiral = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const spiral = [
        'r7c5', 'r7c6', 'r6c6', 'r5c5', 'r5c4', 'r6c4', 'r8c4', 'r9c5', 'r9c6', 'r8c7', 'r7c7', 'r6c8', 'r5c8', 
        'r4c7', 'r3c6', 'r3c5', 'r4c4', 'r5c3', 'r6c2', 'r7c2', 'r8c2', 'r9c2', 'r10c3', 'r11c4', 'r11c5', 'r11c6', 
        'r10c7', 'r9c8', 'r8c8', 'r7c8', 'r6c8', 'r5c8', 'r4c8', 'r3c8', 'r2c7', 'r1c6', 'r1c5', 'r2c4', 'r3c3',
        'r4c2', 'r5c1', 'r6c1', 'r7c1', 'r8c1', 'r9c1'
    ];
    spiral.forEach((id, index) => pattern[id] = index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink');
    return pattern;
};

const createTilingPattern = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            const id = `r${r}c${c}`;
            if (r % 5 === 0 || c % 4 === 0) {
                pattern[id] = 'blue';
            } else if ((r + c) % 6 === 0) {
                pattern[id] = 'yellow';
            } else if ((r - c) % 6 === 0) {
                pattern[id] = 'cyan';
            } else if (r % 3 === 1 && c % 3 === 1) { 
                pattern[id] = 'purple';
            }
        }
    }
    return pattern;
};

// --- NEW PATTERNS (Levels 11-20) ---

// New Easy Patterns
const createSmallCross = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const centerR = 7, centerC = 5;
    const cross = [
        `r${centerR}c${centerC}`, 
        `r${centerR-1}c${centerC}`, `r${centerR+1}c${centerC}`, 
        `r${centerR}c${centerC-1}`, `r${centerR}c${centerC+1}`, 
    ];
    cross.forEach(id => pattern[id] = 'red');
    return pattern;
};

const createBorderFrame = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 1; r < NUM_ROWS - 1; r++) {
        for (let c = 1; c < NUM_COLS - 1; c++) {
            if (r === 1 || r === NUM_ROWS - 2 || c === 1 || c === NUM_COLS - 2) {
                pattern[`r${r}c${c}`] = 'green';
            }
        }
    }
    return pattern;
};

const createSimpleH = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const r = [4, 5, 6, 7, 8, 9, 10];
    const c = [3, 7];
    r.forEach(row => {
        c.forEach(col => pattern[`r${row}c${col}`] = 'orange');
    });
    for (let cMid = 4; cMid <= 6; cMid++) {
        pattern[`r7c${cMid}`] = 'orange';
    }
    return pattern;
};

// New Medium Patterns
const createXShape = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 4; r < 12; r++) {
        for (let c = 3; c < 8; c++) {
            if (r === c + 1 || r + c === 12) { // Rough diagonal check
                pattern[`r${r}c${c}`] = 'purple';
            }
        }
    }
    return pattern;
};

const createYinYang = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const centerR = 7, centerC = 5;
    const radius = 3;
    for (let r = centerR - radius; r <= centerR + radius; r++) {
        for (let c = centerC - radius; c <= centerC + radius; c++) {
            const id = `r${r}c${c}`;
            if (id in createDiamond()) { // Use diamond shape as circle approximation
                if (c <= centerC) { // Left half
                    pattern[id] = 'red';
                } else { // Right half
                    pattern[id] = 'blue';
                }
            }
        }
    }
    pattern[`r${centerR-1}c${centerC}`] = 'blue'; // Top dot
    pattern[`r${centerR+1}c${centerC}`] = 'red'; // Bottom dot
    return pattern;
};

// New Hard Patterns
const createMaze = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const path = [
        'r1c1', 'r1c2', 'r2c2', 'r3c2', 'r3c3', 'r4c3', 'r5c3', 'r6c3', 'r6c4', 'r7c4', 'r8c4', 'r9c4', 'r10c4', 
        'r10c5', 'r11c5', 'r12c5', 'r13c5', 'r13c6', 'r13c7', 'r12c7', 'r11c7', 'r10c7', 'r9c7', 'r8c7', 'r8c8', 
        'r7c8', 'r6c8', 'r5c8', 'r4c8', 'r3c8', 'r2c8', 'r2c9', 'r1c9', 
    ];
    path.forEach((id, index) => pattern[id] = index % 2 === 0 ? 'orange' : 'pink');
    return pattern;
};

const createDiagonalLines = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            // Lines sloping up-right (based on r-c)
            if ((r - c) % 5 === 0) {
                pattern[`r${r}c${c}`] = 'yellow';
            }
            // Lines sloping up-left (based on r+c)
            if ((r + c) % 5 === 0 && (r + c) !== 0) {
                pattern[`r${r}c${c}`] = 'cyan';
            }
        }
    }
    return pattern;
};

// New Very Hard Patterns
const createNestedHexes = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const centerR = 7, centerC = 5;
    // Outer Ring (Red)
    for (let r = 4; r <= 10; r++) {
        for (let c = 2; c <= 8; c++) {
            if (Math.abs(r - centerR) + Math.abs(c - centerC) > 4 && Math.abs(r - centerR) + Math.abs(c - centerC) < 7) {
                pattern[`r${r}c${c}`] = 'red';
            }
        }
    }
    // Middle Ring (Green)
    for (let r = 5; r <= 9; r++) {
        for (let c = 3; c <= 7; c++) {
            if (Math.abs(r - centerR) + Math.abs(c - centerC) === 3) {
                pattern[`r${r}c${c}`] = 'green';
            }
        }
    }
    // Center (Blue)
    pattern[`r${centerR}c${centerC}`] = 'blue';
    return pattern;
};

const createWavePattern = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            const val = r + Math.floor(c / 2); // Simple wave calculation
            if (val % 4 === 0) {
                pattern[`r${r}c${c}`] = 'pink';
            } else if (val % 4 === 1) {
                pattern[`r${r}c${c}`] = 'orange';
            }
        }
    }
    return pattern;
};

const createComplexLogo = (): TargetPattern => {
    const pattern: TargetPattern = {};
    // Large "C" shape (Blue)
    for (let r = 2; r < 13; r++) {
        pattern[`r${r}c${2}`] = 'blue';
    }
    for (let c = 2; c < 7; c++) {
        pattern[`r${2}c${c}`] = 'blue';
        pattern[`r${12}c${c}`] = 'blue';
    }
    
    // Inner "E" shape (Red)
    for (let r = 4; r < 11; r++) {
        pattern[`r${r}c${5}`] = 'red';
    }
    for (let c = 5; c < 9; c++) {
        pattern[`r${4}c${c}`] = 'red';
        pattern[`r${7}c${c}`] = 'red';
        pattern[`r${10}c${c}`] = 'red';
    }
    
    // Filling the core
    pattern['r8c7'] = 'purple';
    pattern['r8c8'] = 'purple';
    pattern['r9c7'] = 'purple';

    return pattern;
};


// --- FINAL LEVEL DATA ARRAY (20 Levels) ---

const LEVEL_DATA: Level[] = [
    // ------------------------------------
    // EASY (Levels 1-5)
    { id: 1, title: 'Blue Diamond', complexity: 'Easy', pattern: createDiamond() },
    { id: 2, title: 'The Arrowhead', complexity: 'Easy', pattern: createArrowhead() },
    { id: 3, title: 'Small Red Cross', complexity: 'Easy', pattern: createSmallCross() },
    { id: 4, title: 'Border Frame', complexity: 'Easy', pattern: createBorderFrame() },
    { id: 5, title: 'Simple Letter H', complexity: 'Easy', pattern: createSimpleH() },
    
    // ------------------------------------
    // MEDIUM (Levels 6-10)
    { id: 6, title: 'The Gnome', complexity: 'Medium', pattern: createGnome() },
    { id: 7, title: 'Hollow Heart', complexity: 'Medium', pattern: createHollowHeart() },
    { id: 8, title: 'Checkerboard', complexity: 'Medium', pattern: createCheckerboard() },
    { id: 9, title: 'X Marks the Spot', complexity: 'Medium', pattern: createXShape() },
    { id: 10, title: 'Yin & Yang', complexity: 'Medium', pattern: createYinYang() },
    
    // ------------------------------------
    // HARD (Levels 11-15)
    { id: 11, title: 'Christmas Tree', complexity: 'Hard', pattern: createTree() },
    { id: 12, title: 'Monarch Butterfly', complexity: 'Hard', pattern: createButterfly() },
    { id: 13, title: 'Cross Hatch', complexity: 'Hard', pattern: createCrossHatch() },
    { id: 14, title: 'The Maze Path', complexity: 'Hard', pattern: createMaze() },
    { id: 15, title: 'Diagonal Stripes', complexity: 'Hard', pattern: createDiagonalLines() },

    // ------------------------------------
    // VERY HARD (Levels 16-20)
    { id: 16, title: 'The Spiral', complexity: 'Very Hard', pattern: createComplexSpiral() },
    { id: 17, title: 'Interlaced Tiling', complexity: 'Very Hard', pattern: createTilingPattern() },
    { id: 18, title: 'Nested Hexes', complexity: 'Very Hard', pattern: createNestedHexes() },
    { id: 19, title: 'Complex Wave', complexity: 'Very Hard', pattern: createWavePattern() },
    { id: 20, title: 'The Letter Logo', complexity: 'Very Hard', pattern: createComplexLogo() },
];


// --- UTILITY: Hexagon Geometry ---

// Function to calculate the SVG points for a hexagon
const getHexagonPoints = (x: number, y: number, size: number): string => {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i + 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    points.push(`${x + size * Math.cos(angle_rad)},${y + size * Math.sin(angle_rad)}`);
  }
  return points.join(' ');
};

// Function to calculate the center coordinates for a hex in a staggered grid
const getHexCenter = (row: number, col: number, size: number): { x: number, y: number } => {
  const width = size * Math.sqrt(3); 
  const h = size * 1.5; 
  
  // Base offset controls the cropping effect on the left and top sides.
  // Using HEX_SIZE * 0.5 (10px) to achieve the crop effect
  const BASE_OFFSET_X = size * 0.5; 
  const BASE_OFFSET_Y = size * 0.5;

  // Staggered X calculation
  const x = width * col + (row % 2 === 1 ? width / 2 : 0) + BASE_OFFSET_X;
  // Y calculation
  const y = h * row + BASE_OFFSET_Y;
  return { x, y };
};

// --- COMPONENTS ---

// Component for a single Hexagon Cell
const HexCell: React.FC<{
  id: string;
  row: number;
  col: number;
  colorKey: string | undefined;
  isInteractive: boolean;
  onCellClick: (id: string) => void;
}> = React.memo(({ id, row, col, colorKey, isInteractive, onCellClick }) => {
  const { x, y } = getHexCenter(row, col, HEX_SIZE);
  const fill = colorKey ? COLORS[colorKey] : '#ffffff'; 
  
  // Use constant stroke for all cells to ensure the grid is always visible
  const strokeColor = '#d1d5db'; 
  const strokeWidth = 0.5;
  
  const clickHandler = isInteractive ? () => onCellClick(id) : undefined;
  const cursorStyle = isInteractive ? 'cursor-pointer hover:stroke-[2px] hover:stroke-blue-500' : 'cursor-default';

  return (
    <polygon
      points={getHexagonPoints(x, y, HEX_SIZE - 1)} 
      fill={fill}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      className={`${cursorStyle} transition-all duration-100`}
      onClick={clickHandler}
    />
  );
});

// Grid Renderer - Used for both Game Canvases and Level Select Previews
const GridRenderer: React.FC<{
    gridData: UserGrid | TargetPattern;
    isInteractive: boolean;
    onCellClick: (id: string) => void;
    isTarget?: boolean;
    previewMode?: boolean; // Smaller size for level selection
}> = React.memo(({ gridData, isInteractive, onCellClick, isTarget = false, previewMode = false }) => {
    
    // Scale down the viewbox for the level selection preview
    const scaleFactor = previewMode ? 0.5 : 1;
    const width = CANVAS_WIDTH * scaleFactor;
    const height = CANVAS_HEIGHT * scaleFactor;

    // Memoize the generation of the SVG cells
    const cells: React.ReactElement[] = useMemo(() => { // FIXED: Changed JSX.Element[] to React.ReactElement[]
        const generatedCells: React.ReactElement[] = [];
        for (let r = 0; r < NUM_ROWS; r++) {
            for (let c = 0; c < NUM_COLS; c++) {
                const id = `r${r}c${c}`;
                const colorKey = gridData[id];

                generatedCells.push(
                    <HexCell
                        key={id}
                        id={id}
                        row={r}
                        col={c}
                        colorKey={colorKey}
                        isInteractive={isInteractive}
                        onCellClick={onCellClick}
                    />
                );
            }
        }
        return generatedCells;
    }, [gridData, isInteractive, onCellClick]);
    
    return (
        <svg
            width={width}
            height={height}
            // ViewBox now exactly matches the calculated geometry (CANVAS_WIDTH/HEIGHT)
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            className={`bg-white border border-gray-300 rounded-lg shadow-inner ${previewMode ? 'm-2' : ''}`}
        >
            {/* Define filter only for the target pattern in game mode */}
            {isTarget && !previewMode && (
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.2"/>
                    </filter>
                </defs>
            )}
            {cells}
        </svg>
    );
});

// Component for the Color Palette
const ColorPalette: React.FC<{
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}> = ({ selectedColor, setSelectedColor }) => (
  // Ensured items are centered and use flex-wrap for responsiveness
  <div className="flex flex-wrap justify-center p-4 space-x-2 space-y-2 bg-white rounded-lg shadow-md items-center">
    {/* Removed space-y-2 on mobile breakpoints to make it a tighter single row */}
    {Object.keys(COLORS).map((colorKey) => (
      <button
        key={colorKey}
        onClick={() => setSelectedColor(colorKey)}
        className={`w-10 h-10 rounded-full transition-all duration-150 transform hover:scale-110 ${
          selectedColor === colorKey ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-400'
        }`}
        style={{ backgroundColor: COLORS[colorKey] }}
        aria-label={`Select ${colorKey} color`}
      />
    ))}
    <button
      onClick={() => setSelectedColor(ERASER_KEY)} 
      className={`p-2 border border-gray-300 rounded-full transition-all duration-150 bg-gray-100 hover:scale-110 ${
        selectedColor === ERASER_KEY ? 'ring-4 ring-offset-2 ring-gray-400' : ''
      }`}
      aria-label="Eraser"
    >
      {/* Eraser SVG Icon */}
      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  </div>
);


// --- RESULT MODAL COMPONENT ---

const ResultModal: React.FC<{
    modalState: ModalState;
    onClose: () => void;
}> = ({ modalState, onClose }) => {
    if (!modalState.isOpen) return null;

    const { isSuccess, title, message } = modalState;
    const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
    const btnColor = isSuccess ? 'bg-green-500 hover:bg-green-700' : 'bg-blue-500 hover:bg-blue-700';
    const buttonText = isSuccess ? 'Continue to Levels' : 'Keep Trying';
    
    const Icon = () => (
        <svg className={`w-16 h-16 mx-auto ${isSuccess ? 'text-green-200' : 'text-red-200'} mb-4`} fill="currentColor" viewBox="0 0 24 24">
            {isSuccess ? (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            ) : (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            )}
        </svg>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
                <div className={`text-white p-4 rounded-t-lg -mt-8 -mx-8 mb-4 ${bgColor} text-center font-bold text-2xl`}>
                    {title}
                </div>
                
                <Icon />

                <p className="text-gray-700 text-center mb-6 text-lg">{message}</p>
                
                <button
                    onClick={onClose}
                    className={`w-full py-3 text-white font-bold text-lg rounded-lg shadow-md transition-all ${btnColor} transform hover:scale-[1.01]`}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};


// --- LEVEL SELECTION SCREEN ---

const LevelSelection: React.FC<{
    unlockedLevels: number;
    onLevelSelect: (index: number) => void;
}> = ({ unlockedLevels, onLevelSelect }) => (
    <div className="w-full max-w-5xl p-6 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Select Your Level
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {LEVEL_DATA.map((level, index) => {
                const isLocked = level.id > unlockedLevels;
                const isCompleted = level.id < unlockedLevels;
                const isNext = level.id === unlockedLevels && level.id < LEVEL_DATA.length;
                
                const complexityColor = level.complexity === 'Easy' ? 'text-green-600' : 
                                        level.complexity === 'Medium' ? 'text-orange-600' : 
                                        level.complexity === 'Hard' ? 'text-red-600' : 
                                        'text-purple-700';

                return (
                    <button
                        key={level.id}
                        onClick={() => !isLocked && onLevelSelect(index)}
                        disabled={isLocked}
                        className={`p-4 border-4 rounded-lg shadow-lg transition-all transform hover:scale-[1.03] relative ${
                            isLocked
                                ? 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-blue-50 border-blue-400 hover:bg-blue-100'
                        }`}
                    >
                        {/* Locked Overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg z-10">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-2 4h4m-1-4h1a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        
                        {/* Status Badges */}
                        {isCompleted && (
                            <span className="absolute top-2 right-2 px-3 py-1 text-xs font-bold text-white bg-green-500 rounded-full shadow-md z-20">
                                ✓ DONE
                            </span>
                        )}
                        {isNext && (
                            <span className="absolute top-2 right-2 px-3 py-1 text-xs font-bold text-white bg-blue-500 rounded-full shadow-md z-20 animate-pulse">
                                PLAY NOW
                            </span>
                        )}
                        
                        <h3 className="text-xl font-semibold mb-1 text-gray-900">{level.title}</h3>
                        <p className={`text-sm font-medium ${complexityColor} mb-2`}>{level.complexity}</p>
                        <div className="flex justify-center">
                            <GridRenderer 
                                gridData={level.pattern} 
                                isInteractive={false} 
                                onCellClick={() => {}}
                                isTarget={true}
                                previewMode={true}
                            />
                        </div>
                    </button>
                );
            })}
        </div>
        {unlockedLevels > LEVEL_DATA.length && (
            <div className="mt-8 p-4 text-center text-2xl font-bold text-blue-700 bg-blue-100 rounded-lg shadow-inner">
                CONGRATULATIONS! You have mastered all 20 levels! 🏆
            </div>
        )}
    </div>
);


// --- MAIN GAME SCREEN ---

const GamePlayScreen: React.FC<{
    level: Level;
    currentGrid: UserGrid;
    setCurrentGrid: React.Dispatch<React.SetStateAction<UserGrid>>;
    selectedColor: string; // Changed to string as ERASER_KEY is a string
    setSelectedColor: (color: string) => void;
    onCheck: () => void;
    onReset: () => void;
    onExit: () => void;
    isSolved: boolean;
    modalState: ModalState;
    onModalClose: () => void;
}> = ({ level, currentGrid, setCurrentGrid, selectedColor, setSelectedColor, onCheck, onReset, onExit, isSolved, modalState, onModalClose }) => {

    // Click Handler (Coloring Logic)
    const handleCellClick = useCallback((id: string) => {
        if (isSolved) return;

        setCurrentGrid((prevGrid) => {
            const newGrid = { ...prevGrid };
            
            if (selectedColor === ERASER_KEY) {
                // If the eraser tool is selected, delete the cell entry
                delete newGrid[id];
            } else {
                // Normal coloring: apply the selected color
                newGrid[id] = selectedColor;
            }
            
            return newGrid;
        });
    }, [selectedColor, isSolved, setCurrentGrid]);


    return (
        <div className="w-full max-w-5xl flex flex-col items-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-700">Level {level.id}: {level.title}</h2>
            
            <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-8">
                {/* Left Panel: Target Display */}
                <div className="bg-white p-6 rounded-xl shadow-lg w-full lg:max-w-xl">
                    <h3 className="text-xl font-semibold mb-3 text-center text-gray-700">Target Pattern</h3>
                    <div className="flex justify-center items-center">
                        <GridRenderer 
                            gridData={level.pattern} 
                            isInteractive={false} 
                            onCellClick={() => {}} 
                            isTarget={true}
                        />
                    </div>
                </div>

                {/* Right Panel: Game Grid */}
                <div className="bg-white p-6 rounded-xl shadow-lg w-full lg:max-w-xl">
                    <h3 className="text-xl font-semibold mb-3 text-center text-gray-700">Your Canvas</h3>
                    <div className="flex justify-center items-center">
                        <GridRenderer 
                            gridData={currentGrid} 
                            isInteractive={true} 
                            onCellClick={handleCellClick} 
                        />
                    </div>
                </div>
            </div>

            {/* Controls and Message */}
            <div className="mt-4 w-full max-w-3xl">
                <ColorPalette
                    selectedColor={selectedColor}
                    setSelectedColor={setSelectedColor}
                />

                <div className="flex justify-center space-x-4 mt-6">
                    <button
                        onClick={onCheck}
                        disabled={isSolved}
                        className={`px-8 py-3 text-lg font-semibold rounded-full shadow-lg transition-all transform hover:scale-[1.02] ${
                            isSolved ? 'bg-green-500 text-white' : 'bg-yellow-500 text-gray-800 hover:bg-yellow-600'
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {isSolved ? 'Completed!' : 'Check Pattern'}
                    </button>
                    <button
                        onClick={onReset}
                        className="px-8 py-3 text-lg font-semibold rounded-full bg-red-500 text-white shadow-lg transition-all transform hover:scale-[1.02] hover:bg-red-600"
                    >
                        Reset
                    </button>
                     <button
                        onClick={onExit}
                        className="px-8 py-3 text-lg font-semibold rounded-full bg-blue-500 text-white shadow-lg transition-all transform hover:scale-[1.02] hover:hover:bg-blue-600"
                    >
                        Back to Levels
                    </button>
                </div>

                {/* The message bar is now replaced by the modal */}
            </div>
            
            <ResultModal modalState={modalState} onClose={onModalClose} /> {/* FIXED: Called onModalClose instead of handleModalClose */}
        </div>
    );
};


// Main Game Component
const App: React.FC = () => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    // Global Game State
    const [gameMode, setGameMode] = useState<GameMode>('selection');
    const [unlockedLevels, setUnlockedLevels] = useState(1);
    
    // Current Level State
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0); 
    const currentLevel = LEVEL_DATA[currentLevelIndex];

    // In-Game State
    // selectedColor can be a color string or the ERASER_KEY string
    const [selectedColor, setSelectedColor] = useState<string>('red'); // Default to 'red'
    const [userGrid, setUserGrid] = useState<UserGrid>({});
    const [isSolved, setIsSolved] = useState(false);
    
    // Modal State
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        isSuccess: false,
        title: '',
        message: '',
    });

    // --- Game Logic Functions ---

    const handleLevelSelect = (index: number) => {
        setCurrentLevelIndex(index);
        // Reset state for the new level
        setUserGrid({});
        setIsSolved(false);
        // Default color selection is 'red'
        setSelectedColor('red'); 
        setGameMode('playing');
        setModalState({ isOpen: false, isSuccess: false, title: '', message: '' }); // Ensure modal is closed
    };
    
    const handleExitGame = () => {
        setGameMode('selection');
    };

    const handleReset = () => {
        setUserGrid({});
        setIsSolved(false);
        setSelectedColor('red');
        setModalState({ isOpen: false, isSuccess: false, title: '', message: '' });
    };
    
    // Logic for what happens when the modal is closed
    const handleModalClose = () => {
        if (modalState.isSuccess) {
            // If successful, auto-move to the level selection screen
            setGameMode('selection');
        }
        // Always close the modal
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    const checkPattern = () => {
        const targetPattern = currentLevel.pattern;
        const targetCount = Object.keys(targetPattern).length;
        const userCount = Object.keys(userGrid).length;

        let isMatch = true;
        let correctCount = 0;

        // 1. Check if all required cells are correct
        for (const id in targetPattern) {
            if (userGrid[id] === targetPattern[id]) {
                correctCount++;
            } else {
                isMatch = false;
            }
        }

        // 2. Check for extraneous colors (user colored outside the target area)
        if (userCount > targetCount) {
             let hasExtra = false;
             for (const id in userGrid) {
                 // Check if the user colored a cell that is NOT part of the target pattern
                 if (!targetPattern.hasOwnProperty(id)) {
                     hasExtra = true;
                     break;
                 }
             }
             if (hasExtra) {
                isMatch = false;
             }
        }
        
        // Final check for perfection
        if (isMatch && correctCount === targetCount) {
            setIsSolved(true);
            
            // Unlock next level if it exists and is currently locked
            const newUnlockedLevels = currentLevel.id === unlockedLevels && currentLevel.id < LEVEL_DATA.length
                ? currentLevel.id + 1
                : unlockedLevels;
            
            setUnlockedLevels(newUnlockedLevels);

            setModalState({
                isOpen: true,
                isSuccess: true,
                title: 'Level Complete!',
                message: `🎉 You perfectly matched the pattern! Level ${currentLevel.id} is solved.`,
            });
            
        } else {
            setIsSolved(false);
            
            setModalState({
                isOpen: true,
                isSuccess: false,
                title: 'Try Again',
                message: `You have ${correctCount} cells correct, but the pattern isn't perfect yet. Review your colors and placement!`,
            });
        }
    };


    // --- Render Logic ---
    
    return (
        <div className="min-h-screen p-4 font-sans flex flex-col items-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-4 border-blue-600 pb-3">
                Hexa-Art Challenge
            </h1>

            {gameMode === 'selection' ? (
                <LevelSelection 
                    unlockedLevels={unlockedLevels}
                    onLevelSelect={handleLevelSelect}
                />
            ) : (
                <GamePlayScreen 
                    level={currentLevel}
                    currentGrid={userGrid}
                    setCurrentGrid={setUserGrid}
                    selectedColor={selectedColor}
                    setSelectedColor={setSelectedColor}
                    onCheck={checkPattern}
                    onReset={handleReset}
                    onExit={handleExitGame}
                    isSolved={isSolved}
                    modalState={modalState}
                    onModalClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default App;
