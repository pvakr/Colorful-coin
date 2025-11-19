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
// const HEX_W = HEX_SIZE * Math.sqrt(3); // Unused
// const HEX_H_SEP = HEX_SIZE * 1.5; // Unused

// Calculated dimensions for a tight fit based on grid geometry
const CANVAS_WIDTH = 357; 
const CANVAS_HEIGHT = 450; 

// --- UTILITY: Pattern Definitions (30 Total) ---

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

// --- NEW PATTERNS (Levels 11-30) ---

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
            // Use diamond shape as circle approximation
            if (id in createDiamond()) { 
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

// Additional 10 levels (Total 30)

// Easy
const createPlusSign = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const centerR = 7, centerC = 5;
    const plus = [
        `r${centerR}c${centerC}`,
        `r${centerR - 1}c${centerC}`, `r${centerR + 1}c${centerC}`,
        `r${centerR}c${centerC - 1}`, `r${centerR}c${centerC + 1}`,
    ];
    plus.forEach(id => pattern[id] = 'green');
    return pattern;
};

const createVerticalStripe = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        pattern[`r${r}c${5}`] = 'blue';
    }
    return pattern;
};

// Medium
const createHourglass = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 2; r <= 12; r++) {
        const centerCol = 5;
        const width = Math.min(r, NUM_ROWS - 1 - r);
        for (let c = centerCol - Math.floor(width / 2); c <= centerCol + Math.floor(width / 2); c++) {
            pattern[`r${r}c${c}`] = 'orange';
        }
    }
    return pattern;
};

const createSquareFrame = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 3; r <= 11; r++) {
        for (let c = 2; c <= 8; c++) {
            if (r === 3 || r === 11 || c === 2 || c === 8) {
                pattern[`r${r}c${c}`] = 'yellow';
            }
        }
    }
    return pattern;
};

// Hard
const createZigZag = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            if ((r + Math.floor(c / 2)) % 3 === 0) {
                pattern[`r${r}c${c}`] = 'pink';
            }
        }
    }
    return pattern;
};

const createAbstractFlower = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const centerR = 7, centerC = 5;
    pattern[`r${centerR}c${centerC}`] = 'yellow'; // Center
    // Petals
    const petals = [
        `r${centerR-2}c${centerC}`, `r${centerR+2}c${centerC}`,
        `r${centerR-1}c${centerC-1}`, `r${centerR-1}c${centerC+1}`,
        `r${centerR+1}c${centerC-1}`, `r${centerR+1}c${centerC+1}`,
        `r${centerR}c${centerC-2}`, `r${centerR}c${centerC+2}`,
    ];
    petals.forEach(id => pattern[id] = 'purple');
    return pattern;
};

// Very Hard
const createInterlockingRings = (): TargetPattern => {
    const pattern: TargetPattern = {};
    // Ring 1 (Red)
    const ring1 = ['r5c4', 'r5c5', 'r6c3', 'r6c6', 'r7c3', 'r7c6', 'r8c4', 'r8c5'];
    ring1.forEach(id => pattern[id] = 'red');
    // Ring 2 (Blue)
    const ring2 = ['r7c7', 'r7c8', 'r8c6', 'r8c9', 'r9c6', 'r9c9', 'r10c7', 'r10c8'];
    ring2.forEach(id => pattern[id] = 'blue');
    // Ring 3 (Green)
    const ring3 = ['r3c7', 'r3c8', 'r4c6', 'r4c9', 'r5c6', 'r5c9', 'r6c7', 'r6c8'];
    ring3.forEach(id => pattern[id] = 'green');
    return pattern;
};

const createPixelArtCharacter = (): TargetPattern => {
    const pattern: TargetPattern = {};
    // Head (Blue)
    for (let r = 3; r <= 5; r++) {
        for (let c = 4; c <= 6; c++) {
            pattern[`r${r}c${c}`] = 'blue';
        }
    }
    // Eyes (Cyan)
    pattern['r4c4'] = 'cyan';
    pattern['r4c6'] = 'cyan';
    // Body (Red)
    for (let r = 6; r <= 9; r++) {
        for (let c = 3; c <= 7; c++) {
            pattern[`r${r}c${c}`] = 'red';
        }
    }
    // Arms (Orange)
    pattern['r7c2'] = 'orange';
    pattern['r7c8'] = 'orange';
    pattern['r8c2'] = 'orange';
    pattern['r8c8'] = 'orange';
    // Legs (Green)
    pattern['r10c4'] = 'green';
    pattern['r10c6'] = 'green';
    return pattern;
};

const createGeometricGradient = (): TargetPattern => {
    const pattern: TargetPattern = {};
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            const sum = r + c;
            if (sum < 5) {
                pattern[`r${r}c${c}`] = 'blue';
            } else if (sum < 9) {
                pattern[`r${r}c${c}`] = 'cyan';
            } else if (sum < 13) {
                pattern[`r${r}c${c}`] = 'green';
            } else if (sum < 17) {
                pattern[`r${r}c${c}`] = 'yellow';
            } else {
                pattern[`r${r}c${c}`] = 'orange';
            }
        }
    }
    return pattern;
};

const createIntricateStar = (): TargetPattern => {
    const pattern: TargetPattern = {};
    const centerR = 7, centerC = 5;
    // Main star points (red)
    const starPoints = [
        `r${centerR}c${centerC}`,
        `r${centerR-3}c${centerC}`, `r${centerR+3}c${centerC}`,
        `r${centerR-1}c${centerC-2}`, `r${centerR-1}c${centerC+2}`,
        `r${centerR+1}c${centerC-2}`, `r${centerR+1}c${centerC+2}`,
        `r${centerR-2}c${centerC-1}`, `r${centerR-2}c${centerC+1}`,
        `r${centerR+2}c${centerC-1}`, `r${centerR+2}c${centerC+1}`,
    ];
    starPoints.forEach(id => pattern[id] = 'red');

    // Inner details (purple)
    const innerDetails = [
        `r${centerR-2}c${centerC}`, `r${centerR+2}c${centerC}`,
        `r${centerR-1}c${centerC}`, `r${centerR+1}c${centerC}`,
        `r${centerR}c${centerC-1}`, `r${centerR}c${centerC+1}`,
        `r${centerR-1}c${centerC-2}`, `r${centerR+1}c${centerC-2}`,
        `r${centerR-1}c${centerC+2}`, `r${centerR+1}c${centerC+2}`,
    ];
    innerDetails.forEach(id => pattern[id] = 'purple');

    // Even more inner (pink)
    pattern[`r${centerR}c${centerC}`] = 'pink';
    pattern[`r${centerR-1}c${centerC}`] = 'pink';
    pattern[`r${centerR+1}c${centerC}`] = 'pink';
    pattern[`r${centerR}c${centerC-1}`] = 'pink';
    pattern[`r${centerR}c${centerC+1}`] = 'pink';


    return pattern;
};


// --- FINAL LEVEL DATA ARRAY (30 Levels) ---

const LEVEL_DATA: Level[] = [
    // ------------------------------------
    // EASY (Levels 1-7)
    { id: 1, title: 'Blue Diamond', complexity: 'Easy', pattern: createDiamond() },
    { id: 2, title: 'The Arrowhead', complexity: 'Easy', pattern: createArrowhead() },
    { id: 3, title: 'Small Red Cross', complexity: 'Easy', pattern: createSmallCross() },
    { id: 4, title: 'Border Frame', complexity: 'Easy', pattern: createBorderFrame() },
    { id: 5, title: 'Simple Letter H', complexity: 'Easy', pattern: createSimpleH() },
    { id: 6, title: 'Green Plus Sign', complexity: 'Easy', pattern: createPlusSign() },
    { id: 7, title: 'Vertical Blue Stripe', complexity: 'Easy', pattern: createVerticalStripe() },
    
    // ------------------------------------
    // MEDIUM (Levels 8-14)
    { id: 8, title: 'The Gnome', complexity: 'Medium', pattern: createGnome() },
    { id: 9, title: 'Hollow Heart', complexity: 'Medium', pattern: createHollowHeart() },
    { id: 10, title: 'Checkerboard', complexity: 'Medium', pattern: createCheckerboard() },
    { id: 11, title: 'X Marks the Spot', complexity: 'Medium', pattern: createXShape() },
    { id: 12, title: 'Yin & Yang', complexity: 'Medium', pattern: createYinYang() },
    { id: 13, title: 'Orange Hourglass', complexity: 'Medium', pattern: createHourglass() },
    { id: 14, title: 'Yellow Square Frame', complexity: 'Medium', pattern: createSquareFrame() },
    
    // ------------------------------------
    // HARD (Levels 15-21)
    { id: 15, title: 'Christmas Tree', complexity: 'Hard', pattern: createTree() },
    { id: 16, title: 'Monarch Butterfly', complexity: 'Hard', pattern: createButterfly() },
    { id: 17, title: 'Cross Hatch', complexity: 'Hard', pattern: createCrossHatch() },
    { id: 18, title: 'The Maze Path', complexity: 'Hard', pattern: createMaze() },
    { id: 19, title: 'Diagonal Stripes', complexity: 'Hard', pattern: createDiagonalLines() },
    { id: 20, title: 'Pink Zig Zag', complexity: 'Hard', pattern: createZigZag() },
    { id: 21, title: 'Abstract Flower', complexity: 'Hard', pattern: createAbstractFlower() },

    // ------------------------------------
    // VERY HARD (Levels 22-30)
    { id: 22, title: 'The Spiral', complexity: 'Very Hard', pattern: createComplexSpiral() },
    { id: 23, title: 'Interlaced Tiling', complexity: 'Very Hard', pattern: createTilingPattern() },
    { id: 24, title: 'Nested Hexes', complexity: 'Very Hard', pattern: createNestedHexes() },
    { id: 25, title: 'Complex Wave', complexity: 'Very Hard', pattern: createWavePattern() },
    { id: 26, title: 'The Letter Logo', complexity: 'Very Hard', pattern: createComplexLogo() },
    { id: 27, title: 'Interlocking Rings', complexity: 'Very Hard', pattern: createInterlockingRings() },
    { id: 28, title: 'Pixel Art Character', complexity: 'Very Hard', pattern: createPixelArtCharacter() },
    { id: 29, title: 'Geometric Gradient', complexity: 'Very Hard', pattern: createGeometricGradient() },
    { id: 30, title: 'Intricate Star', complexity: 'Very Hard', pattern: createIntricateStar() },
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

/**
 * Game Header component that displays the title and acts as a Home button.
 * Clicking it navigates back to the level selection screen.
 */
const GameHeader: React.FC<{ onHomeClick: () => void, gameMode: GameMode }> = ({ onHomeClick, gameMode }) => {
    // Conditional styling to make the title smaller on the gameplay screen
    const titleStyle = gameMode === 'selection' ? 'text-4xl' : 'text-xl';
    
    return (
        <header className="w-full max-w-6xl flex justify-center mb-10">
            <button
                onClick={onHomeClick}
                // Use relative path "/" logic (which navigates to selection in this environment)
                className={`flex items-center space-x-3 p-3 rounded-full transition-all duration-300 transform hover:scale-[1.03] hover:shadow-xl bg-white shadow-lg border-2 border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-300`}
                aria-label="Go to Home/Level Selection"
            >
                {/* Custom Hexagon Icon (Logo) */}
                <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 2 L35 11.5 L35 30.5 L20 39 L5 30.5 L5 11.5 Z" fill="#6366f1" fillOpacity="0.2"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 2 L35 11.5 L35 30.5 L20 39 L5 30.5 L5 11.5 Z M20 10 L28 15 L28 25 L20 30 L12 25 L12 15 Z" />
                </svg>
                <h1 className={`${titleStyle} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-wider`}>
                    Hexa-Art Challenge
                </h1>
            </button>
            
        </header>
    );
};


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
  const strokeColor = '#b3b3b3'; // Slightly darker stroke for better contrast
  const strokeWidth = 0.5;
  
  const clickHandler = isInteractive ? () => onCellClick(id) : undefined;
  // Enhanced hover effect
  const cursorStyle = isInteractive ? 'cursor-pointer hover:stroke-[2px] hover:stroke-indigo-500' : 'cursor-default';

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
    const cells: React.ReactElement[] = useMemo(() => { 
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
            className={`bg-white border-2 border-gray-400 rounded-xl shadow-lg ${previewMode ? 'm-2' : ''}`}
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
  // Enhanced shadow, rounded edges, and padding
  <div className="flex flex-wrap justify-center p-4 space-x-2 space-y-2 bg-white rounded-2xl shadow-2xl border border-gray-200 items-center">
    
    {Object.keys(COLORS).map((colorKey) => (
      <button
        key={colorKey}
        onClick={() => setSelectedColor(colorKey)}
        className={`w-12 h-12 rounded-full transition-all duration-150 transform hover:scale-110 shadow-md ${
          selectedColor === colorKey ? 'ring-4 ring-offset-2 ring-indigo-500 shadow-xl' : 'hover:ring-2 hover:ring-gray-400'
        }`}
        style={{ backgroundColor: COLORS[colorKey] }}
        aria-label={`Select ${colorKey} color`}
      />
    ))}
    <button
      onClick={() => setSelectedColor(ERASER_KEY)} 
      // Larger, more distinct eraser button style
      className={`p-3 border-2 border-gray-400 rounded-full transition-all duration-150 bg-gray-300 hover:scale-110 shadow-lg ${
        selectedColor === ERASER_KEY ? 'ring-4 ring-offset-2 ring-gray-600 shadow-xl' : ''
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
    const btnColor = isSuccess ? 'bg-green-500 hover:bg-green-700 shadow-green-600/50' : 'bg-blue-500 hover:bg-blue-700 shadow-blue-600/50';
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
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100 border-4 border-gray-300">
                <div className={`text-white p-4 rounded-t-lg -mt-8 -mx-8 mb-4 ${bgColor} text-center font-bold text-2xl shadow-xl`}>
                    {title}
                </div>
                
                <Icon />

                <p className="text-gray-700 text-center mb-6 text-lg">{message}</p>
                
                <button
                    onClick={onClose}
                    className={`w-full py-3 text-white font-bold text-lg rounded-lg shadow-xl transition-all ${btnColor} transform hover:scale-[1.02] active:scale-[0.98]`}
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
    <div className="w-full max-w-7xl p-6  rounded-2xl">
        {/* Removed H2: "Select Your Challenge" */}
        <p className="text-xl font-medium text-center text-gray-600 mb-8">
            Choose a puzzle to begin your Hexa-Art Challenge.
        </p>

        {/* UPDATED: Change grid layout to show 3 columns on small screens and up (sm:grid-cols-3) 
            and 4 columns on medium screens (md:grid-cols-4)
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-6">
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
                        className={`p-4 border-4 rounded-xl shadow-xl transition-all duration-300 transform relative ${
                            isLocked
                                ? 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-blue-50 border-blue-400 hover:bg-blue-100 hover:scale-[1.05] active:scale-[1.03]'
                        }`}
                    >
                        {/* Locked Overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg z-10">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-2 4h4m-1-4h1a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        
                        {/* Status Badges */}
                        {isCompleted && (
                            <span className="absolute top-1 right-1 px-3 py-1 text-xs font-bold text-white bg-green-500 rounded-full shadow-md z-20 border-2 border-white">
                                ✓ DONE
                            </span>
                        )}
                        {isNext && (
                            <span className="absolute top-1 right-1 px-3 py-1 text-xs font-bold text-white bg-blue-500 rounded-full shadow-md z-20 animate-pulse border-2 border-white">
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
            <div className="mt-8 p-4 text-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-red-600 bg-yellow-100 rounded-xl shadow-inner border-4 border-yellow-300">
                CONGRATULATIONS! You have mastered all {LEVEL_DATA.length} levels! 🏆
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
        <div className="w-full max-w-6xl flex flex-col items-center space-y-8">
            {/* Level Title is now displayed here, separate from the main Game Header */}
            <h2 className="text-3xl font-bold text-gray-700 p-2 bg-white rounded-xl shadow-md border-b-2 border-indigo-300">Level {level.id}: {level.title}</h2>
            
            <div className="flex flex-col xl:flex-row space-y-6 xl:space-y-0 xl:space-x-8 w-full justify-center">
                {/* Left Panel: Target Display - Semi-transparent blue background */}
                <div className="bg-blue-100/50 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border-4 border-blue-400 w-full xl:max-w-md">
                    <h3 className="text-xl font-semibold mb-3 text-center text-gray-800 border-b pb-2">Target Pattern</h3>
                    <div className="flex justify-center items-center">
                        <GridRenderer 
                            gridData={level.pattern} 
                            isInteractive={false} 
                            onCellClick={() => {}} 
                            isTarget={true}
                        />
                    </div>
                </div>

                {/* Right Panel: Game Grid - Semi-transparent green background */}
                <div className="bg-green-100/50 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border-4 border-green-400 w-full xl:max-w-md">
                    <h3 className="text-xl font-semibold mb-3 text-center text-gray-800 border-b pb-2">Your Canvas</h3>
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
            <div className="mt-4 w-full max-w-4xl flex flex-col items-center space-y-6">
                <ColorPalette
                    selectedColor={selectedColor}
                    setSelectedColor={setSelectedColor}
                />

                <div className="flex flex-wrap justify-center space-x-4 space-y-2 mt-4">
                    <button
                        onClick={onCheck}
                        disabled={isSolved}
                        className={`px-8 py-3 text-lg font-extrabold rounded-full shadow-2xl transition-all duration-200 transform hover:scale-[1.05] active:scale-[0.98] ${
                            isSolved 
                                ? 'bg-green-500 text-white shadow-green-400/50' 
                                : 'bg-yellow-400 text-gray-800 hover:bg-yellow-500 shadow-yellow-400/50'
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {isSolved ? 'Completed!' : 'Check Pattern'}
                    </button>
                    <button
                        onClick={onReset}
                        className="px-8 py-3 text-lg font-semibold rounded-full bg-red-500 text-white shadow-lg transition-all transform hover:scale-[1.05] active:scale-[0.98] hover:bg-red-600 shadow-red-500/50"
                    >
                        Reset
                    </button>
                     <button
                        onClick={onExit}
                        className="px-8 py-3 text-lg font-semibold rounded-full bg-blue-500 text-white shadow-lg transition-all transform hover:scale-[1.05] active:scale-[0.98] hover:hover:bg-blue-600 shadow-blue-500/50"
                    >
                        Back to Levels
                    </button>
                </div>
            </div>
            
            <ResultModal modalState={modalState} onClose={onModalClose} /> 
        </div>
    );
};


// Main Game Component
const App: React.FC = () => {
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
    
    // This function handles the "Home" functionality from the header/logo click
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
            {/* Game Header replaces the old H1. It is clickable to return home. */}
            <GameHeader onHomeClick={handleExitGame} gameMode={gameMode} />

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