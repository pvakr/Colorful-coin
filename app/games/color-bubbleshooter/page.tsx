/**
 * Bubble Shooter Game - Built with React, TypeScript, and HTML5 Canvas.
 */
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import GameWrapper from "@/components/GameWrapper";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Target, Zap } from "lucide-react";

// --- Game Constants and Types ---
const BUBBLE_RADIUS = 18;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const GRID_COLS = 16;
const GRID_ROWS = 12;
const WALL_THICKNESS = 4;
const SHOOTER_Y = 700;
const SHOOTER_X = 300;
const COLORS = [
  "#FF5733", // Red-Orange
  "#33FF57", // Bright Green
  "#3357FF", // Blue
  "#FF33F6", // Magenta
  "#33FFF6", // Cyan
  "#F3FF33", // Yellow-Green
] as const;

type Color = (typeof COLORS)[number];

interface Position {
  x: number;
  y: number;
}

interface Bubble {
  id: number;
  pos: Position;
  color: Color;
  gridPos: { row: number; col: number };
  isStuck: boolean; // Is it part of the grid?
  velocity?: Position; // Used for flying/falling bubbles
}

// --- Utility Functions ---

/**
 * Calculates the center position of a bubble in the staggered hexagonal grid.
 */
const getBubbleCenter = (row: number, col: number): Position => {
  const rowOffset = (row % 2) * BUBBLE_RADIUS;

  const x = WALL_THICKNESS + BUBBLE_RADIUS + col * BUBBLE_DIAMETER + rowOffset;
  const y =
    WALL_THICKNESS + BUBBLE_RADIUS + row * (BUBBLE_DIAMETER * 0.866);

  return { x, y };
};

/**
 * Generates the initial game grid.
 */
const initializeGrid = (): Bubble[] => {
  const bubbles: Bubble[] = [];
  let id = 0;
  const initialRows = 8;
  const colorsAvailable = COLORS.slice(0, 4); // Use first 4 colors initially

  for (let r = 0; r < initialRows; r++) {
    const colsInRow = r % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
    for (let c = 0; c < colsInRow; c++) {
      const colorIndex = Math.floor(Math.random() * colorsAvailable.length);
      const color = colorsAvailable[colorIndex];
      const pos = getBubbleCenter(r, c);

      bubbles.push({
        id: id++,
        pos,
        color,
        gridPos: { row: r, col: c },
        isStuck: true,
      });
    }
  }
  return bubbles;
};

// --- Main Component ---

export default function BubbleShooterGame() {
  // Ref for generating unique IDs for new bubbles
  const idCounterRef = useRef(0);
  const router = useRouter()
  // --- Game State ---
  const [gridBubbles, setGridBubbles] = useState<Bubble[]>(initializeGrid());
  const [shotBubble, setShotBubble] = useState<Bubble | null>(null);
  const [nextBubble, setNextBubble] = useState<Bubble | null>(null);
  const [fallingBubbles, setFallingBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<"ready" | "playing" | "gameover">(
    "ready"
  );
  const [aimAngle, setAimAngle] = useState(90); // Angle in degrees (90 is straight up)

  // --- Refs for Canvas and Animation Loop ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const gameBoundary = useMemo(() => ({ width: 600, height: 800 }), []);

  // --- Initializers and Resets ---

  const getNewRandomBubble = useCallback(
    (isNext = false): Bubble => {
      const id = idCounterRef.current++;

      const currentColors = new Set(gridBubbles.map((b) => b.color));
      const availableColors =
        currentColors.size > 0
          ? (Array.from(currentColors) as Color[])
          : COLORS.slice(0, 4);

      const color =
        availableColors[
          Math.floor(Math.random() * availableColors.length)
        ] || COLORS[0];

      return {
        id,
        pos: { x: SHOOTER_X, y: isNext ? SHOOTER_Y + 50 : SHOOTER_Y },
        color,
        gridPos: { row: -1, col: -1 },
        isStuck: false,
      };
    },
    [gridBubbles]
  );

  useEffect(() => {
    if (!shotBubble) {
      setShotBubble(getNewRandomBubble());
    }
    if (!nextBubble) {
      setNextBubble(getNewRandomBubble(true));
    }
  }, [shotBubble, nextBubble, getNewRandomBubble]);

  // --- Drawing Logic ---

  const drawBubble = useCallback(
    (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
      ctx.beginPath();
      ctx.arc(bubble.pos.x, bubble.pos.y, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = bubble.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    },
    []
  );

  const drawAimLine = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (gameStatus !== "ready" || !shotBubble) return;

      const angleRad = (aimAngle * Math.PI) / 180;
      const stepDistance = BUBBLE_RADIUS * 2.5;

      const maxFlightDistance =
        SHOOTER_Y - (WALL_THICKNESS + BUBBLE_RADIUS);

      let vx = Math.cos(angleRad) * stepDistance;
      let vy = -Math.sin(angleRad) * stepDistance;

      let distanceTraveled = 0;

      let currentX = shotBubble.pos.x;
      let currentY = shotBubble.pos.y;

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

      for (let i = 1; distanceTraveled < maxFlightDistance * 2; i++) {
        currentX += vx;
        currentY += vy;
        distanceTraveled += stepDistance;

        const hitsLeft = currentX < WALL_THICKNESS + BUBBLE_RADIUS;
        const hitsRight =
          currentX >
          gameBoundary.width - WALL_THICKNESS - BUBBLE_RADIUS;

        if (hitsLeft || hitsRight) {
          const bounceOffset = hitsLeft
            ? (WALL_THICKNESS +
                BUBBLE_RADIUS -
                (currentX - vx)) /
              vx
            : (gameBoundary.width -
                WALL_THICKNESS -
                BUBBLE_RADIUS -
                (currentX - vx)) /
              vx;

          currentX = currentX - vx + vx * bounceOffset;
          currentY = currentY - vy + vy * bounceOffset;

          vx *= -1;

          currentX += vx * (1 - bounceOffset);
          currentY += vy * (1 - bounceOffset);
        }

        if (currentY < WALL_THICKNESS + BUBBLE_RADIUS) break;

        ctx.beginPath();
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      }
    },
    [aimAngle, gameStatus, shotBubble, gameBoundary.width]
  );

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, gameBoundary.width, gameBoundary.height);

    // Draw boundary/walls
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, gameBoundary.width, WALL_THICKNESS); // Top
    ctx.fillRect(0, 0, WALL_THICKNESS, gameBoundary.height); // Left
    ctx.fillRect(
      gameBoundary.width - WALL_THICKNESS,
      0,
      WALL_THICKNESS,
      gameBoundary.height
    ); // Right

    // Draw stuck bubbles
    gridBubbles.forEach((bubble) => drawBubble(ctx, bubble));

    // Draw falling bubbles
    fallingBubbles.forEach((bubble) => drawBubble(ctx, bubble));

    // Draw shot bubble
    if (shotBubble) {
      const radius =
        shotBubble.pos.y > SHOOTER_Y ? BUBBLE_RADIUS * 0.8 : BUBBLE_RADIUS;
      ctx.beginPath();
      ctx.arc(shotBubble.pos.x, shotBubble.pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = shotBubble.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    }

    // Draw next bubble (if it's not the same one as the shot bubble)
    if (nextBubble && shotBubble && nextBubble.id !== shotBubble.id) {
      drawBubble(ctx, nextBubble);
    }

    // Draw aiming line
    drawAimLine(ctx);

    // Draw Game Over Screen
    if (gameStatus === "gameover") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, gameBoundary.width, gameBoundary.height);
      ctx.fillStyle = "white";
      ctx.font = "48px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", gameBoundary.width / 2, gameBoundary.height / 2);
      ctx.font = "24px Inter, sans-serif";
      ctx.fillText(
        `Final Score: ${score}`,
        gameBoundary.width / 2,
        gameBoundary.height / 2 + 50
      );
    }
  }, [
    gridBubbles,
    fallingBubbles,
    shotBubble,
    nextBubble,
    gameBoundary.width,
    gameBoundary.height,
    drawBubble,
    drawAimLine,
    gameStatus,
    score,
  ]);

  // --- Game Logic ---

  const checkCollision = (b1: Position, b2: Position, radius: number) => {
    const dx = b1.x - b2.x;
    const dy = b1.y - b2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius * 2;
  };

  const findSnapLocation = useCallback(
    (
      shot: Bubble,
      existingBubbles: Bubble[],
      forceRow: number | null = null
    ) => {
      let bestSpot: { row: number; col: number; dist: number } | null = null;
      let minDist = Infinity;

      const occupied = new Set(
        existingBubbles.map((b) => `${b.gridPos.row},${b.gridPos.col}`)
      );

      let startRow: number;
      let endRow: number;

      if (forceRow !== null) {
        startRow = endRow = forceRow;
      } else {
        const hitRow = Math.floor(
          (shot.pos.y - WALL_THICKNESS) / (BUBBLE_DIAMETER * 0.866)
        );
        startRow = Math.max(0, hitRow - 1);
        endRow = Math.min(GRID_ROWS - 1, hitRow + 1);
      }

      for (let r = startRow; r <= endRow; r++) {
        const colsInRow = r % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
        for (let c = 0; c < colsInRow; c++) {
          if (!occupied.has(`${r},${c}`)) {
            const center = getBubbleCenter(r, c);
            const dx = shot.pos.x - center.x;
            const dy = shot.pos.y - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < BUBBLE_RADIUS * 1.5 && dist < minDist) {
              minDist = dist;
              bestSpot = { row: r, col: c, dist };
            }
          }
        }
      }

      if (bestSpot) {
        return {
          row: bestSpot.row,
          col: bestSpot.col,
          pos: getBubbleCenter(bestSpot.row, bestSpot.col),
        };
      }
      return null;
    },
    []
  );

  /**
   * Find clusters and floating bubbles.
   * Returns:
   *  - updatedBubbles: remaining stuck bubbles on grid
   *  - totalGained: score to add
   *  - floatingToDrop: bubbles that should visually fall down
   */
  const findMatchesAndDrops = useCallback(
    (newBubbles: Bubble[], snappedBubble: Bubble) => {
      const bubbles = newBubbles;

      const gridMap: (Bubble | null)[][] = Array.from(
        { length: GRID_ROWS },
        () => Array<Bubble | null>(GRID_COLS).fill(null)
      );

      const bubblesById = new Map<number, Bubble>();

      bubbles.forEach((b) => {
        if (b.gridPos.row !== -1 && b.gridPos.col !== -1) {
          if (b.gridPos.row % 2 !== 0 && b.gridPos.col >= GRID_COLS - 1) return;
          if (b.gridPos.col < GRID_COLS) {
            gridMap[b.gridPos.row][b.gridPos.col] = b;
            bubblesById.set(b.id, b);
          }
        }
      });

      const getNeighborsByGridPos = (r: number, c: number): Bubble[] => {
        const neighbors: Bubble[] = [];
        const isOddRow = r % 2 !== 0;

        const offsets = isOddRow
          ? [
              [-1, 0],
              [-1, 1],
              [0, -1],
              [0, 1],
              [1, 0],
              [1, 1],
            ]
          : [
              [-1, -1],
              [-1, 0],
              [0, -1],
              [0, 1],
              [1, -1],
              [1, 0],
            ];

        for (const [dr, dc] of offsets) {
          const nr = r + dr;
          const nc = c + dc;

          if (nr >= 0 && nr < GRID_ROWS) {
            const colsInRow = nr % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
            if (nc >= 0 && nc < colsInRow) {
              const neighbor = gridMap[nr][nc];
              if (neighbor) {
                neighbors.push(neighbor);
              }
            }
          }
        }
        return neighbors;
      };

      // --- 1. Find same-color cluster starting from snappedBubble ---
      const matches: Bubble[] = [];
      const stack: Bubble[] = [snappedBubble];
      const visited = new Set<number>();

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current.id)) continue;

        visited.add(current.id);
        matches.push(current);

        const neighbors = getNeighborsByGridPos(
          current.gridPos.row,
          current.gridPos.col
        );

        neighbors.forEach((neighbor) => {
          if (
            neighbor.color === snappedBubble.color &&
            !visited.has(neighbor.id)
          ) {
            stack.push(neighbor);
          }
        });
      }

      const bubblesToRemove = new Set<number>();
      if (matches.length >= 3) {
        matches.forEach((m) => bubblesToRemove.add(m.id));
      }

      // --- 2. Find bubbles still connected to ceiling (excluding removed matches) ---
      const connectedToCeiling = new Set<number>();
      const ceilingQueue: Bubble[] = [];

      gridMap[0].forEach((b) => {
        if (b && !bubblesToRemove.has(b.id)) {
          ceilingQueue.push(b);
          connectedToCeiling.add(b.id);
        }
      });

      let head = 0;
      while (head < ceilingQueue.length) {
        const current = ceilingQueue[head++];
        const neighbors = getNeighborsByGridPos(
          current.gridPos.row,
          current.gridPos.col
        );

        neighbors.forEach((neighbor) => {
          if (
            !bubblesToRemove.has(neighbor.id) &&
            !connectedToCeiling.has(neighbor.id)
          ) {
            connectedToCeiling.add(neighbor.id);
            ceilingQueue.push(neighbor);
          }
        });
      }

      // --- 3. Floating bubbles (not connected to ceiling, not part of matches) ---
      const floatingIds: number[] = [];
      bubbles
        .filter((b) => b.isStuck)
        .forEach((b) => {
          if (
            !connectedToCeiling.has(b.id) &&
            !bubblesToRemove.has(b.id)
          ) {
            floatingIds.push(b.id);
            bubblesToRemove.add(b.id); // removed from grid, will become falling
          }
        });

      const floatingToDrop: Bubble[] = bubbles
        .filter((b) => floatingIds.includes(b.id))
        .map((b) => ({
          ...b,
          isStuck: false,
          gridPos: { row: -1, col: -1 },
          // Straight downward fall
          velocity: { x: 0, y: 10 },
        }));

      // --- 4. Remaining bubbles on grid ---
      const updatedBubbles = bubbles.filter(
        (b) => !bubblesToRemove.has(b.id)
      );

      // --- 5. Score ---
      const matchScore = matches.length >= 3 ? matches.length * 10 : 0;
      const floatScore = floatingIds.length * 50;
      const totalGained = matchScore + floatScore;

      return { updatedBubbles, totalGained, floatingToDrop };
    },
    []
  );

  // --- Game Loop ---

  const gameLoop = useCallback(() => {
    if (gameStatus === "gameover") {
      animationRef.current = null;
      return;
    }

    // Win condition: board cleared
    if (gridBubbles.length === 0 && fallingBubbles.length === 0) {
      setGameStatus("ready");
      return;
    }

    // Game over: lowest stuck bubble crosses shooter line
    const lowestBubble = gridBubbles.reduce(
      (maxY, b) => Math.max(maxY, b.pos.y),
      0
    );
    if (lowestBubble > SHOOTER_Y - BUBBLE_RADIUS) {
      setGameStatus("gameover");
      return;
    }

    // --- Move falling bubbles ---
    if (fallingBubbles.length > 0) {
      setFallingBubbles((prev) =>
        prev
          .map((b) => {
            const vx = b.velocity?.x ?? 0;
            const vy = b.velocity?.y ?? 0;
            return {
              ...b,
              pos: { x: b.pos.x + vx, y: b.pos.y + vy },
            };
          })
          // Remove once far below screen
          .filter(
            (b) => b.pos.y - BUBBLE_RADIUS <= gameBoundary.height + 60
          )
      );
    }

    // --- Bubble in flight (shotBubble) ---
    if (shotBubble && shotBubble.velocity) {
      let newX = shotBubble.pos.x + shotBubble.velocity.x;
      let newY = shotBubble.pos.y + shotBubble.velocity.y;
      let collided = false;
      let snappedToCeiling = false;

      // Side walls
      if (
        newX < WALL_THICKNESS + BUBBLE_RADIUS ||
        newX > gameBoundary.width - WALL_THICKNESS - BUBBLE_RADIUS
      ) {
        shotBubble.velocity.x *= -1;
        if (newX < WALL_THICKNESS + BUBBLE_RADIUS) {
          newX = WALL_THICKNESS + BUBBLE_RADIUS + 0.1;
        } else {
          newX =
            gameBoundary.width -
            WALL_THICKNESS -
            BUBBLE_RADIUS -
            0.1;
        }
      }

      // Top wall
      if (newY < WALL_THICKNESS + BUBBLE_RADIUS) {
        collided = true;
        snappedToCeiling = true;
        newY = WALL_THICKNESS + BUBBLE_RADIUS;
      }

      // Collision with stuck bubbles
      if (!collided) {
        for (const gridB of gridBubbles) {
          if (
            checkCollision(
              { x: newX, y: newY },
              gridB.pos,
              BUBBLE_RADIUS
            )
          ) {
            collided = true;
            break;
          }
        }
      }

      if (collided) {
        setGameStatus("ready");

        const posBeforeCollision: Position = {
          x: shotBubble.pos.x + shotBubble.velocity.x * 0.9,
          y: shotBubble.pos.y + shotBubble.velocity.y * 0.9,
        };

        const snapInfo = findSnapLocation(
          { ...shotBubble, pos: posBeforeCollision },
          gridBubbles,
          snappedToCeiling ? 0 : null
        );

        if (snapInfo) {
          const newStuckBubble: Bubble = {
            ...shotBubble,
            isStuck: true,
            velocity: undefined,
            pos: snapInfo.pos,
            gridPos: { row: snapInfo.row, col: snapInfo.col },
          };

          const tempGrid = [...gridBubbles, newStuckBubble];
          const {
            updatedBubbles,
            totalGained,
            floatingToDrop,
          } = findMatchesAndDrops(tempGrid, newStuckBubble);

          setGridBubbles(updatedBubbles);
          setScore((s) => s + totalGained);

          if (floatingToDrop.length > 0) {
            setFallingBubbles((prev) => [...prev, ...floatingToDrop]);
          }

          if (nextBubble) {
            const newShot: Bubble = {
              ...nextBubble,
              pos: { x: SHOOTER_X, y: SHOOTER_Y },
              velocity: undefined,
            };
            setShotBubble(newShot);
          }

          setNextBubble(getNewRandomBubble(true));
        } else {
          // No snap (edge case) – just load the next bubble
          if (nextBubble) {
            const newShot: Bubble = {
              ...nextBubble,
              pos: { x: SHOOTER_X, y: SHOOTER_Y },
              velocity: undefined,
            };
            setShotBubble(newShot);
          } else {
            setShotBubble(getNewRandomBubble());
          }
          setNextBubble(getNewRandomBubble(true));
        }
      } else {
        // Update flying position
        setShotBubble((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            pos: { x: newX, y: newY },
          };
        });
      }
    }

    drawGame();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [
    shotBubble,
    gridBubbles,
    fallingBubbles.length,
    nextBubble,
    gameBoundary.width,
    drawGame,
    findSnapLocation,
    findMatchesAndDrops,
    getNewRandomBubble,
    gameStatus,
    gameBoundary.height,
  ]);

  // --- Input Handlers ---

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameStatus !== "ready" || !shotBubble) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = mouseX - SHOOTER_X;
      const dy = mouseY - SHOOTER_Y;
      let angle = (Math.atan2(-dy, dx) * 180) / Math.PI;

      angle = Math.max(20, Math.min(160, angle));

      setAimAngle(angle);
    },
    [gameStatus, shotBubble]
  );

  const handleShoot = useCallback(() => {
    if (gameStatus !== "ready" || !shotBubble) return;

    const angleRad = (aimAngle * Math.PI) / 180;
    const speed = 15;

    const vx = Math.cos(angleRad) * speed;
    const vy = -Math.sin(angleRad) * speed;

    setShotBubble((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        velocity: { x: vx, y: vy },
      };
    });
    setGameStatus("playing");
  }, [gameStatus, shotBubble, aimAngle]);

  // --- Game Initialization Effect ---

  useEffect(() => {
    if (animationRef.current === null) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [gameLoop]);

  // --- UI Handlers ---

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to /games
    console.log("Navigating back to games...");
  };

  const restartGame = () => {
    idCounterRef.current = 0;
    setGridBubbles(initializeGrid());
    setScore(0);
    setShotBubble(getNewRandomBubble());
    setNextBubble(getNewRandomBubble(true));
    setFallingBubbles([]);
    setGameStatus("ready");

    if (animationRef.current === null) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  };

  return (
    <GameWrapper
      title="Bubble Shooter"
      description="Pop matching bubbles before they reach the bottom!"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative border-4 border-slate-700 rounded-xl shadow-2xl overflow-hidden bg-slate-900/50 backdrop-blur">
            <canvas
              ref={canvasRef}
              width={gameBoundary.width}
              height={gameBoundary.height}
              onMouseMove={handleMouseMove}
              className="cursor-crosshair"
            />
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            {gameStatus === "ready" && (
              <p className="text-lg text-yellow-300">Aim with Mouse, Click to Shoot!</p>
            )}
            {gameStatus === "playing" && (
              <p className="text-lg text-cyan-300 animate-pulse">Bubble in Flight...</p>
            )}
            {gameStatus === "gameover" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-2xl font-bold text-white">Game Over!</p>
                <Button
                  onClick={restartGame}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-xl px-8 py-3 shadow-xl"
                >
                  RESTART GAME
                </Button>
              </motion.div>
            )}

            <div className="flex items-center space-x-4 p-3 bg-white/10 backdrop-blur rounded-xl border border-white/20">
              <p className="text-sm font-medium text-white/80">Next:</p>
              <div
                className="w-10 h-10 rounded-full shadow-inner border-2 border-white/30"
                style={{ backgroundColor: nextBubble?.color || "gray" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </GameWrapper>
  );
}
