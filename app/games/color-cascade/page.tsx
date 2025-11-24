"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";

// --- GLOBAL TYPE DECLARATIONS ---
declare const __app_id: string | undefined;

// --- CONSTANTS & CONFIGURATION ---

const GRID_SIZE = 15; // Decreased grid size
const TILE_SIZE = 38; // Decreased tile size
const GAP_SIZE = 3;
const NUM_PATTERNS = 3;

// Game Colors (Simplified to RGB spectrum colors)
const GAME_COLORS = {
  red: "#FF4545", // Red
  green: "#4CAF50", // Green
  blue: "#2196F3", // Blue
  yellow: "#FFEB3B", // Yellow
  cyan: "#00BCD4", // Cyan
  purple: "#9C27B0", // Magenta:Violet
  orange: "#FF9800", // Orange
};

// --- TYPE DEFINITIONS ---

type ColorKey = keyof typeof GAME_COLORS;
type Grid = (ColorKey | null)[][];
type Tile = {
  id: number;
  colorMap: Map<string, ColorKey>; // Maps coordinate string "r,c" to ColorKey
  shape: [number, number][]; // Relative coordinates [row, col]
  used: boolean;
  color: ColorKey;
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

const generateRandomTileSet = (initialId: number): TileSet => {
  // Shapes are max 4 blocks
  const safeShapes: [number, number][][] = [
    [[0, 0]],
    [
      [0, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  ];

  const tileSet: TileSet = [];

  for (let i = 0; i < NUM_PATTERNS; i++) {
    const shape =
      safeShapes[Math.floor(Math.random() * safeShapes.length)];
    const colorMap: Map<string, ColorKey> = new Map();

    const tempGrid: (ColorKey | null)[][] = Array(4)
      .fill(null)
      .map(() => Array(4).fill(null));
    const [minR, minC] = shape.reduce(
      ([minR, minC], [r, c]) => [Math.min(minR, r), Math.min(minC, c)],
      [Infinity, Infinity]
    );

    const sortedShape = [...shape].sort((a, b) =>
      a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]
    );

    sortedShape.forEach(([r, c]) => {
      let placed = false;
      let attempts = 0;

      const tr = r - minR;
      const tc = c - minC;

      while (!placed && attempts < 20) {
        attempts++;
        const newColor = getRandomColor();

        let createsMatch3 = false;

        // Horizontal check
        if (
          tempGrid[tr]?.[tc - 1] === newColor &&
          tempGrid[tr]?.[tc - 2] === newColor
        )
          createsMatch3 = true;
        if (
          tempGrid[tr]?.[tc + 1] === newColor &&
          tempGrid[tr]?.[tc + 2] === newColor
        )
          createsMatch3 = true;
        if (
          tempGrid[tr]?.[tc - 1] === newColor &&
          tempGrid[tr]?.[tc + 1] === newColor
        )
          createsMatch3 = true;

        // Vertical check
        if (
          tempGrid[tr - 1]?.[tc] === newColor &&
          tempGrid[tr - 2]?.[tc] === newColor
        )
          createsMatch3 = true;
        if (
          tempGrid[tr + 1]?.[tc] === newColor &&
          tempGrid[tr + 2]?.[tc] === newColor
        )
          createsMatch3 = true;
        if (
          tempGrid[tr - 1]?.[tc] === newColor &&
          tempGrid[tr + 1]?.[tc] === newColor
        )
          createsMatch3 = true;

        if (!createsMatch3) {
          tempGrid[tr][tc] = newColor;
          colorMap.set(`${r},${c}`, newColor);
          placed = true;
        }
      }
      if (!placed) {
        const safeColor = getRandomColor(
          tempGrid[tr][tc - 1] || tempGrid[tr - 1][tc]
        );
        colorMap.set(`${r},${c}`, safeColor);
      }
    });

    const defaultColor =
      (colorMap.values().next().value as ColorKey) || getRandomColor();

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

const findGroupMatches = (grid: Grid): [number, number][] => {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(false));
  const finalTilesToClear: Set<string> = new Set();
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

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
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            !visited[nr][nc] &&
            grid[nr][nc] === color
          ) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }

      if (currentCluster.length >= 3) {
        currentCluster.forEach(([cr, cc]) =>
          finalTilesToClear.add(`${cr},${cc}`)
        );
      }
    }
  }

  return Array.from(finalTilesToClear).map((coordStr) => {
    const [r, c] = coordStr.split(",").map(Number);
    return [r, c] as [number, number];
  });
};

const clearMatches = (
  grid: Grid,
  coordsToClear: [number, number][]
): { newGrid: Grid; scoreDelta: number } => {
  let scoreDelta = 0;
  const newGrid = grid.map((row) => [...row]);

  coordsToClear.forEach(([r, c]) => {
    if (newGrid[r][c]) {
      newGrid[r][c] = null;
      scoreDelta += 1;
    }
  });

  return { newGrid, scoreDelta };
};

// --- COMPONENT: Tile Display ---

const TilePreview: React.FC<{
  tile: Tile;
  scale?: number;
  draggable: boolean;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    tile: Tile,
    scale: number
  ) => void;
}> = ({ tile, scale = 1, draggable, onDragStart }) => {
  const minR = Math.min(...tile.shape.map((s) => s[0]));
  const minC = Math.min(...tile.shape.map((s) => s[1]));
  const tileW =
    Math.max(...tile.shape.map((s) => s[1])) - minC + 1;
  const tileH =
    Math.max(...tile.shape.map((s) => s[0])) - minR + 1;

  const opacity = tile.used ? 0.2 : 1;
  const cursor = tile.used
    ? "cursor-default"
    : "cursor-grab active:cursor-grabbing";

  const containerWidth =
    tileW * TILE_SIZE * scale + (tileW - 1) * GAP_SIZE * scale;
  const containerHeight =
    tileH * TILE_SIZE * scale + (tileH - 1) * GAP_SIZE * scale;

  return (
    <div
      className={`transition-all duration-200 ${cursor} select-none bg-transparent`}
      draggable={draggable && !tile.used}
      onDragStart={(e) => onDragStart(e, tile, scale)}
      style={{
        opacity,
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tileW}, ${
            TILE_SIZE * scale
          }px)`,
          gridTemplateRows: `repeat(${tileH}, ${
            TILE_SIZE * scale
          }px)`,
          gap: `${GAP_SIZE * scale}px`,
          pointerEvents: "none",
        }}
      >
        {tile.shape.map(([r, c], index) => {
          const colorKey =
            tile.colorMap.get(`${r},${c}`) || tile.color;

          return (
            <div
              key={index}
              className="rounded-md shadow-sm border border-black/10"
              style={{
                gridArea: `${r - minR + 1} / ${
                  c - minC + 1
                } / span 1 / span 1`,
                backgroundColor: GAME_COLORS[colorKey],
                width: "100%",
                height: "100%",
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
  onDrop: (
    e: React.DragEvent<HTMLDivElement>,
    r: number,
    c: number
  ) => void;
  onDragOver: (
    e: React.DragEvent<HTMLDivElement>,
    r: number,
    c: number
  ) => void;
  highlightCells: [number, number][];
  matchCells: [number, number][];
}> = ({
  grid,
  onDrop,
  onDragOver,
  highlightCells,
  matchCells,
}) => {
  const highlightSet = useMemo(
    () => new Set(highlightCells.map(([r, c]) => `${r},${c}`)),
    [highlightCells]
  );
  const matchSet = useMemo(
    () => new Set(matchCells.map(([r, c]) => `${r},${c}`)),
    [matchCells]
  );

  const placementIsValid = highlightCells.length > 0;

  const highlightRingColor = "ring-green-500 z-10";
  const highlightBgColor = "bg-green-100/80";

  const totalSize =
    GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * GAP_SIZE;

  return (
    <div className="shadow-2xl rounded-xl border-4 border-gray-700/50 p-2 bg-gray-900/10 inline-block">
      <div
        className="mx-auto"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
          gap: `${GAP_SIZE}px`,
          width: `${totalSize}px`,
          height: `${totalSize}px`,
        }}
      >
        {grid.map((row, r) =>
          row.map((colorKey, c) => {
            const cellId = `${r},${c}`;
            const isHighlighted = highlightSet.has(cellId);
            const isMatch = matchSet.has(cellId);

            // Removed default background color for empty cells
            let backgroundColor = colorKey
              ? GAME_COLORS[colorKey as ColorKey]
              : "transparent"; 

            let className =
              "relative transition-all duration-150 rounded-sm border border-gray-300/50"; // Added border for grid visibility
            let transformStyle = "";

            if (isHighlighted && placementIsValid) {
              className = `relative transition-all duration-150 rounded-sm border ring-4 ring-inset ${highlightRingColor} ${highlightBgColor} opacity-100`;
              transformStyle = "scale(1.1)";
            }

            if (isMatch) {
              className += " animate-pulse z-20 opacity-80";
              if (colorKey) {
                backgroundColor =
                  GAME_COLORS[colorKey as ColorKey];
              }
              transformStyle = "scale(1.2)";
            }

            if (!colorKey && !isHighlighted && !isMatch) {
              // Ensure empty cell has a distinct hover effect
              className += " hover:bg-white/50";
            }

            if (colorKey && !isHighlighted && !isMatch) {
              className +=
                " shadow-sm border border-black/5";
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
  const initialGrid: Grid = Array(GRID_SIZE)
    .fill(0)
    .map(
      () =>
        Array(GRID_SIZE).fill(
          null
        ) as (ColorKey | null)[]
    );

  const [grid, setGrid] = useState<Grid>(initialGrid);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [tileSet, setTileSet] = useState<TileSet>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [tileIdCounter, setTileIdCounter] =
    useState(NUM_PATTERNS);

  // Drag State
  const [draggedTile, setDraggedTile] =
    useState<Tile | null>(null);
  // anchor within the tile.shape coordinates that you grabbed (ar, ac)
  const [dragAnchor, setDragAnchor] = useState<
    [number, number] | null
  >(null);
  const [highlightCells, setHighlightCells] = useState<
    [number, number][]
  >([]);

  // Match State
  const [matchCells, setMatchCells] = useState<
    [number, number][]
  >([]);

  useEffect(() => {
    setTileSet(generateRandomTileSet(0));
    const savedHighScore =
      localStorage.getItem("hexaMatchHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  const resetGame = useCallback(() => {
    setGrid(
      Array(GRID_SIZE)
        .fill(0)
        .map(
          () =>
            Array(GRID_SIZE).fill(
              null
            ) as (ColorKey | null)[]
        )
    );
    setScore(0);
    setTileSet(generateRandomTileSet(0));
    setTileIdCounter(NUM_PATTERNS);
    setIsGameOver(false);
    setMatchCells([]);
    setHighlightCells([]);
  }, []);

  // --- DRAG LOGIC ---

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    tile: Tile,
    scale: number
  ) => {
    setDraggedTile(tile);

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Mouse position inside the preview container
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    // Tile bounding box in shape coordinates
    const minR = Math.min(...tile.shape.map((s) => s[0]));
    const minC = Math.min(...tile.shape.map((s) => s[1]));
    const tileW =
      Math.max(...tile.shape.map((s) => s[1])) - minC + 1;
    const tileH =
      Math.max(...tile.shape.map((s) => s[0])) - minR + 1;

    // IMPORTANT: Use TILE_SIZE for calculation, NOT scaled size.
    const baseCellSize = TILE_SIZE;
    const baseGap = GAP_SIZE;
    const baseStride = baseCellSize + baseGap;
    
    // Reverse scale the local coordinates
    const unscaledLocalX = localX / scale;
    const unscaledLocalY = localY / scale;

    // Which visual cell did we grab (row/col index in the preview grid)?
    let col = Math.floor(unscaledLocalX / baseStride);
    let row = Math.floor(unscaledLocalY / baseStride);

    // Safety checks for boundary
    if (col < 0) col = 0;
    if (row < 0) row = 0;
    if (col >= tileW) col = tileW - 1;
    if (row >= tileH) row = tileH - 1;

    // Map that preview cell back to a specific shape coordinate (ar, ac)
    let anchorR = tile.shape[0][0];
    let anchorC = tile.shape[0][1];

    for (const [r, c] of tile.shape) {
      const nr = r - minR;
      const nc = c - minC;
      if (nr === row && nc === col) {
        anchorR = r;
        anchorC = c;
        break;
      }
    }

    setDragAnchor([anchorR, anchorC]);

    // Standard drag data + ghost
    e.dataTransfer.setData("text/plain", tile.id.toString());
    e.dataTransfer.effectAllowed = "move";

    const dragGhost = target.cloneNode(true) as HTMLElement;
    dragGhost.style.position = "absolute";
    dragGhost.style.top = "-1000px";
    dragGhost.style.left = "-1000px";
    dragGhost.style.opacity = "1";
    dragGhost.style.backgroundColor = "transparent";
    // Scale factor applied to drag image must match the preview scale (1.1)
    const DRAG_SCALE = 1.1; 
    dragGhost.style.transform = `scale(${1 / DRAG_SCALE})`;
    dragGhost.style.transformOrigin = "top left";
    dragGhost.style.pointerEvents = "none";

    document.body.appendChild(dragGhost);

    // The offset here needs to compensate for the fact that the drag image 
    // is now scaled down (by 1/1.1), so we scale the mouse offset by that factor too.
    const dragOffsetScale = 1 / DRAG_SCALE;
    e.dataTransfer.setDragImage(
      dragGhost,
      localX * dragOffsetScale,
      localY * dragOffsetScale
    );

    setTimeout(() => {
      if (document.body.contains(dragGhost)) {
        document.body.removeChild(dragGhost);
      }
    }, 0);
  };

  const isValidPlacement = useCallback(
    (tile: Tile, rootR: number, rootC: number): boolean => {
      if (!tile || tile.used) return false;

      for (const [dr, dc] of tile.shape) {
        const r = rootR + dr;
        const c = rootC + dc;

        if (
          r < 0 ||
          r >= GRID_SIZE ||
          c < 0 ||
          c >= GRID_SIZE
        ) {
          return false;
        }
        if (grid[r][c] !== null) {
          return false;
        }
      }
      return true;
    },
    [grid]
  );

  const handleDragOver = useCallback(
    (
      e: React.DragEvent<HTMLDivElement>,
      r: number,
      c: number
    ) => {
      e.preventDefault();
      if (!draggedTile) return;
      if (!dragAnchor) {
        e.dataTransfer.dropEffect = "none";
        return;
      }

      const [anchorR, anchorC] = dragAnchor;

      // Calculate the root cell (top-left of the piece) so that the 
      // block at anchorR, anchorC lands precisely on the hovered cell (r, c).
      const rootR = r - anchorR;
      const rootC = c - anchorC;

      const placementIsValid = isValidPlacement(
        draggedTile,
        rootR,
        rootC
      );

      const newHighlightCells: [number, number][] = [];
      if (placementIsValid) {
        for (const [dr, dc] of draggedTile.shape) {
          newHighlightCells.push([
            rootR + dr,
            rootC + dc,
          ]);
        }
      }

      if (
        JSON.stringify(newHighlightCells) !==
        JSON.stringify(highlightCells)
      ) {
        setHighlightCells(newHighlightCells);
      }

      e.dataTransfer.dropEffect = placementIsValid
        ? "move"
        : "none";
    },
    [draggedTile, dragAnchor, highlightCells, isValidPlacement]
  );

  const handleDragEnd = () => {
    setDraggedTile(null);
    setDragAnchor(null);
    setHighlightCells([]);
  };

  // --- GAMEPLAY LOGIC ---

  const applyPlacement = useCallback(
    async (tile: Tile, rootR: number, rootC: number) => {
      let newGrid = grid.map((row) => [...row]);
      let scoreDelta = 0;

      for (const [dr, dc] of tile.shape) {
        const r = rootR + dr;
        const c = rootC + dc;
        const colorKey =
          tile.colorMap.get(`${dr},${dc}`) || tile.color;
        newGrid[r][c] = colorKey;
      }

      const newTileSet = tileSet.map((t) =>
        t.id === tile.id ? { ...t, used: true } : t
      );

      setTileSet(newTileSet);

      let currentGrid = newGrid;
      let totalScoreDelta = scoreDelta;

      const loop = (currentGrid: Grid): Grid => {
        const matches = findGroupMatches(currentGrid);
        if (matches.length === 0) {
          return currentGrid;
        }

        setMatchCells(matches);

        const {
          newGrid: clearedGrid,
          scoreDelta: clearScore,
        } = clearMatches(currentGrid, matches);
        totalScoreDelta += clearScore;

        setTimeout(
          () => setMatchCells([]),
          300
        );
        return loop(clearedGrid);
      };

      const finalGrid = loop(newGrid);

      setGrid(finalGrid);

      const newScore = score + totalScoreDelta;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem(
          "hexaMatchHighScore",
          newScore.toString()
        );
      }

      const allUsed = newTileSet.every((t) => t.used);
      if (allUsed) {
        const nextTileSet =
          generateRandomTileSet(tileIdCounter);
        setTileSet(nextTileSet);
        setTileIdCounter(
          (prev) => prev + NUM_PATTERNS
        );
        checkGameOver(finalGrid, nextTileSet);
      } else {
        checkGameOver(finalGrid, newTileSet);
      }
    },
    [
      grid,
      score,
      highScore,
      tileSet,
      tileIdCounter,
    ]
  );

  const handleDrop = useCallback(
    (
      e: React.DragEvent<HTMLDivElement>,
      r: number,
      c: number
    ) => {
      e.preventDefault();
      const droppedTile = draggedTile;
      
      // Must check dragAnchor here, or logic below will fail.
      if (!dragAnchor || !droppedTile) return;
      
      const [anchorR, anchorC] = dragAnchor;

      setDraggedTile(null);
      setDragAnchor(null);
      setHighlightCells([]);

      const rootR = r - anchorR;
      const rootC = c - anchorC;

      if (
        isValidPlacement(
          droppedTile,
          rootR,
          rootC
        )
      ) {
        applyPlacement(
          droppedTile,
          rootR,
          rootC
        );
      }
    },
    [draggedTile, dragAnchor, isValidPlacement, applyPlacement]
  );

  const checkGameOver = useCallback(
    (currentGrid: Grid, currentTileSet: TileSet) => {
      let remainingTiles =
        currentTileSet.filter((t) => !t.used);

      if (
        remainingTiles.length === 0 &&
        currentTileSet.length === NUM_PATTERNS &&
        currentTileSet.some((t) => !t.used)
      ) {
        remainingTiles = currentTileSet;
      }

      if (remainingTiles.length === 0) return;

      let canPlaceAnyTile = false;

      for (const tile of remainingTiles) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const canPlace = !tile.used &&
              tile.shape.every(([dr, dc]) => {
                const tr = r + dr;
                const tc = c + dc;
                return (
                  tr >= 0 &&
                  tr < GRID_SIZE &&
                  tc >= 0 &&
                  tc < GRID_SIZE &&
                  currentGrid[tr][tc] === null
                );
              });

            if (canPlace) {
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
    },
    []
  );

  useEffect(() => {
    if (!isGameOver && tileSet.length > 0) {
      checkGameOver(grid, tileSet);
    }
  }, [tileSet, grid, isGameOver, checkGameOver]);

  // --- RENDER ---

  return (
    <div className="min-h-screen p-6 font-sans flex flex-col items-center from-slate-100 to-slate-200">
      {/* Header and Scoreboard */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 p-4 bg-white rounded-xl shadow-xl border-b-4 border-indigo-400">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-wide">
          Color Cascade
        </h1>

        <div className="flex items-center space-x-6 text-center">
          <a
            href="/games"
            className="p-3 rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
            aria-label="Go to Home"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </a>

          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Score
            </p>
            <p className="text-2xl font-black text-green-600">
              {score}
            </p>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Best
            </p>
            <p className="text-2xl font-black text-red-500">
              {highScore}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full max-w-[1600px] space-y-8 lg:space-y-0 lg:space-x-8 justify-center items-start">
        {/* Main Game Grid */}
        <div className="flex-shrink-0 mx-auto">
          <MainGrid
            grid={grid}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            highlightCells={highlightCells}
            matchCells={matchCells}
          />
        </div>

        {/* Tile Palette / Controls */}
        <div className="w-full max-w-md lg:w-64 flex flex-col space-y-6 mx-auto">
          {/* Pieces Container */}
          <div className="p-4 bg-white rounded-xl shadow-xl border-2 border-gray-200 w-full min-h-[400px] flex flex-col">
            <p className="text-lg font-bold text-gray-700 mb-6 text-center border-b pb-4 tracking-tight">
              DRAG PIECES
            </p>
            <div
              className="flex flex-col items-center justify-start space-y-10 flex-grow py-4"
              onDragEnd={handleDragEnd}
            >
              {tileSet.length === 0 ? (
                <div className="py-12 text-gray-400 animate-pulse">
                  Generating pieces...
                </div>
              ) : (
                tileSet.map((tile) => (
                  <TilePreview
                    key={tile.id}
                    tile={tile}
                    draggable={true}
                    onDragStart={handleDragStart}
                    scale={1.1}
                  />
                ))
              )}
            </div>
          </div>

          {/* New Game Button */}
          <button
            onClick={resetGame}
            className="w-full py-4 text-lg font-bold rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:bg-indigo-800 transition-all transform active:scale-95"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center border-4 border-red-500 transform animate-bounce-in">
            <h2 className="text-5xl font-black text-gray-800 mb-2">
              GAME OVER
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto mb-6 rounded-full"></div>

            <div className="mb-8 space-y-2">
              <p className="text-gray-500 font-medium uppercase tracking-widest text-sm">
                Final Score
              </p>
              <p className="text-6xl font-black text-indigo-600">
                {score}
              </p>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 text-xl font-bold rounded-xl bg-green-500 text-white shadow-xl shadow-green-200 hover:bg-green-600 hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
