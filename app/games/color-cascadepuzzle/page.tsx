"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { LucideDroplet, LucideZap, LucideRedo, LucideArrowLeft, Trophy, Target, Zap } from "lucide-react"
import GameWrapper from "@/components/GameWrapper";

// --- 1. CONFIGURATION AND TYPES ---

type Color = "R" | "Y" | "B" | "E"
const CLEAR_COLOR: Color = "E"

// ✅ Only ONE color for all pieces/obstacles
const PRIMARY_COLORS: Color[] = ["R"]

const GRID_ROWS = 20
const GRID_COLS = 10
const BLOCK_SIZE_PX = 30

const COLOR_MAP: Record<Color, { className: string; hex: string }> = {
  R: { className: "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)]", hex: "#2dd4bf" },
  Y: { className: "bg-yellow-400 shadow-yellow-600/50", hex: "#facc15" }, // unused now
  B: { className: "bg-blue-500 shadow-blue-700/50", hex: "#3b82f6" },     // unused now
  E: { className: "bg-slate-950", hex: "#020617" },
}

interface GridCell {
  color: Color
  isOccupied: boolean
}

interface Piece {
  shape: Color[][]
  color: Color
  row: number
  col: number
}

interface GameState {
  grid: GridCell[][]
  currentPiece: Piece | null
  nextPiece: Piece | null
  score: number
  level: number
  isGameOver: boolean
  isPaused: boolean
  dropTimer: number
  targetDropTime: number
  isInitialized: boolean
}

const initialGrid: GridCell[][] = Array.from({ length: GRID_ROWS }, () =>
  Array.from({ length: GRID_COLS }, () => ({ color: CLEAR_COLOR, isOccupied: false })),
)

const initialGameState: GameState = {
  grid: initialGrid,
  currentPiece: null,
  nextPiece: null,
  score: 0,
  level: 1,
  isGameOver: false,
  isPaused: false,
  dropTimer: 0,
  targetDropTime: 1000,
  isInitialized: false,
}

// --- 2. GAME LOGIC ---

const mixColors = (c1: Color, c2: Color): Color => {
  // With PRIMARY_COLORS = ["R"], this effectively becomes:
  // E + R = R, R + E = R, R + R = R
  if (c1 === CLEAR_COLOR) return c2
  if (c2 === CLEAR_COLOR) return c1
  if (c1 === c2) return c1
  // (Unreachable now, but kept for safety)
  return CLEAR_COLOR
}

const TETROMINOES = [
  { shape: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], type: "I" },
  { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], type: "T" },
  { shape: [[1, 1], [1, 1]], type: "O" },
  { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], type: "L" },
  { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], type: "J" },
  { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], type: "S" },
  { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], type: "Z" },
]

const getNewPiece = (): Piece => {
  const template = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]
  const randomColor = PRIMARY_COLORS[0] // always "R"
  const shape = template.shape.map(row => row.map(cell => (cell ? randomColor : CLEAR_COLOR)))

  return {
    shape: shape as Color[][],
    color: randomColor,
    row: -1,
    col: Math.floor((GRID_COLS - template.shape[0].length) / 2),
  }
}

const isValidMove = (grid: GridCell[][], piece: Piece, newRow: number, newCol: number): boolean => {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] !== CLEAR_COLOR) {
        const boardR = newRow + r
        const boardC = newCol + c

        if (boardC < 0 || boardC >= GRID_COLS) {
          return false
        }
        if (boardR >= GRID_ROWS) {
          return false
        }
        if (boardR >= 0 && grid[boardR][boardC].isOccupied) {
          return false
        }
      }
    }
  }
  return true
}

const rotate = (piece: Piece, grid: GridCell[][]): Piece => {
  const N = piece.shape.length
  const newShape = piece.shape.map((row, i) => row.map((_, j) => piece.shape[N - 1 - j][i]))

  if (isValidMove(grid, { ...piece, shape: newShape as Color[][] }, piece.row, piece.col)) {
    return { ...piece, shape: newShape as Color[][] }
  }
  return piece
}

const lockPiece = (grid: GridCell[][], piece: Piece): GridCell[][] => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })))

  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      const pieceColor = piece.shape[r][c]
      if (pieceColor !== CLEAR_COLOR) {
        const boardR = piece.row + r
        const boardC = piece.col + c

        if (boardR >= 0 && boardR < GRID_ROWS && boardC >= 0 && boardC < GRID_COLS) {
          const existingColor = newGrid[boardR][boardC].color
          const mixedColor = mixColors(existingColor, pieceColor)
          newGrid[boardR][boardC] = {
            color: mixedColor,
            isOccupied: mixedColor !== CLEAR_COLOR,
          }
        }
      }
    }
  }
  return newGrid
}

const clearLines = (grid: GridCell[][]): { newGrid: GridCell[][]; linesCleared: number; blocksCleared: number; points: number } => {
  let linesCleared = 0
  let totalPoints = 0
  let totalBlocksCleared = 0
  const rowsToKeep: GridCell[][] = []

  for (let r = GRID_ROWS - 1; r >= 0; r--) {
    const row = grid[r]
    const isFull = row.every(cell => cell.isOccupied)

    if (isFull) {
      const firstColor = row[0].color
      const isSameColorBlast =
        firstColor !== CLEAR_COLOR && row.every(cell => cell.color === firstColor)

      if (isSameColorBlast) {
        // ✅ This is your "single-color row clear"
        totalPoints += 150
        totalBlocksCleared += GRID_COLS
        linesCleared++
        continue
      }
    }

    rowsToKeep.unshift(row)
  }

  while (rowsToKeep.length < GRID_ROWS) {
    rowsToKeep.unshift(
      Array.from({ length: GRID_COLS }, () => ({ color: CLEAR_COLOR, isOccupied: false })),
    )
  }

  return { newGrid: rowsToKeep, linesCleared, blocksCleared: totalBlocksCleared, points: totalPoints }
}

// --- 3. REACT COMPONENT ---

export default function ColorCascadePuzzle() {
  const router = useRouter()
  const [state, setState] = useState<GameState>(initialGameState)

  const gameStateRef = useRef(state)
  const gameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    gameStateRef.current = state
  }, [state])

  useEffect(() => {
    if (state.isInitialized) {
      setState(prev => ({
        ...prev,
        targetDropTime: 1000 - Math.min(prev.level * 50, 800),
      }))
    }
  }, [state.level, state.isInitialized])

  const handleBack = useCallback(() => {
    if (gameRef.current) cancelAnimationFrame(gameRef.current)
    router.push("/games")
  }, [router])

  const tryMove = useCallback((newRow: number, newCol: number, newShape?: Color[][]): boolean => {
    const { currentPiece, grid } = gameStateRef.current
    if (!currentPiece) return false

    const pieceToTest: Piece = {
      ...currentPiece,
      row: newRow,
      col: newCol,
      shape: newShape || currentPiece.shape,
    }

    if (isValidMove(grid, pieceToTest, newRow, newCol)) {
      setState(prev => ({ ...prev, currentPiece: pieceToTest }))
      return true
    }
    return false
  }, [])

  const processLock = useCallback((lockedPiece: Piece, currentNextPiece: Piece, currentGrid: GridCell[][]) => {
    if (!lockedPiece || !currentNextPiece) return

    let newGrid = lockPiece(currentGrid, lockedPiece)

    const {
      newGrid: clearedGrid,
      linesCleared,
      blocksCleared: lineBlocks,
      points: linePoints,
    } = clearLines(newGrid)

    const totalBlocksCleared = lineBlocks

    const isNextPieceBlocked = !isValidMove(
      clearedGrid,
      currentNextPiece,
      currentNextPiece.row,
      currentNextPiece.col,
    )

    if (isNextPieceBlocked) {
      setState(prev => ({ ...prev, isGameOver: true, isPaused: false }))
      return
    }

    setState(prev => {
      const totalPoints = linePoints + (linesCleared > 0 ? prev.level * 50 : 0)
      const newScore = prev.score + totalPoints
      const newLevel = prev.level + Math.floor(totalBlocksCleared / 5)

      return {
        ...prev,
        grid: clearedGrid,
        currentPiece: currentNextPiece,
        nextPiece: getNewPiece(),
        score: newScore,
        level: newLevel,
        dropTimer: 0,
      }
    })
  }, [])

  const handleLock = useCallback(() => {
    const { grid, currentPiece, nextPiece } = gameStateRef.current
    if (!currentPiece || !nextPiece) return
    processLock(currentPiece, nextPiece, grid)
  }, [processLock])

  const gameLoop = useCallback(
    (currentTime: number) => {
      const { isGameOver, isPaused, dropTimer, targetDropTime, currentPiece, isInitialized } =
        gameStateRef.current

      if (!isGameOver && !isPaused && isInitialized) {
        const deltaTime = currentTime - lastTimeRef.current
        lastTimeRef.current = currentTime

        const newDropTimer = dropTimer + deltaTime

        if (newDropTimer >= targetDropTime) {
          if (currentPiece) {
            const moved = tryMove(currentPiece.row + 1, currentPiece.col)
            if (!moved) {
              handleLock()
            }
          }
          setState(prev => ({ ...prev, dropTimer: 0 }))
        } else {
          setState(prev => ({ ...prev, dropTimer: newDropTimer }))
        }
      } else {
        lastTimeRef.current = currentTime
      }

      gameRef.current = requestAnimationFrame(gameLoop)
    },
    [tryMove, handleLock],
  )

  const initializeGame = useCallback(() => {
    const firstPiece = getNewPiece()
    const secondPiece = getNewPiece()

    setState({
      ...initialGameState,
      currentPiece: firstPiece,
      nextPiece: secondPiece,
      isInitialized: true,
    })

    lastTimeRef.current = performance.now()
  }, [])

  const startGame = useCallback(() => {
    initializeGame()
    if (gameRef.current) cancelAnimationFrame(gameRef.current)
    gameRef.current = requestAnimationFrame(gameLoop)
  }, [initializeGame, gameLoop])

  useEffect(() => {
    startGame()
    return () => {
      if (gameRef.current) cancelAnimationFrame(gameRef.current)
    }
  }, [startGame])

  // --- Keyboard Input ---

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { isGameOver, isPaused, currentPiece, grid, isInitialized, nextPiece } =
        gameStateRef.current
      if (!isInitialized) return

      if (isGameOver) {
        if (event.key === "Enter") startGame()
        return
      }
      if (!currentPiece) return

      switch (event.key) {
        case "ArrowLeft":
          if (!isPaused) tryMove(currentPiece.row, currentPiece.col - 1)
          break
        case "ArrowRight":
          if (!isPaused) tryMove(currentPiece.row, currentPiece.col + 1)
          break
        case "ArrowDown":
          if (!isPaused) {
            tryMove(currentPiece.row + 1, currentPiece.col)
            setState(prev => ({ ...prev, score: prev.score + 1 }))
          }
          break
        case "ArrowUp":
          if (!isPaused) {
            const rotatedPiece = rotate(currentPiece, grid)
            setState(prev => ({ ...prev, currentPiece: rotatedPiece }))
          }
          break
        case " ":
          // Hard drop
          event.preventDefault()
          if (isPaused) return

          let finalRow = currentPiece.row
          while (isValidMove(grid, currentPiece, finalRow + 1, currentPiece.col)) {
            finalRow++
          }

          const pieceMoved = finalRow !== currentPiece.row

          if (pieceMoved) {
            const pieceAtRest: Piece = { ...currentPiece, row: finalRow }
            if (nextPiece) {
              processLock(pieceAtRest, nextPiece, grid)
            }
          } else if (!isValidMove(grid, currentPiece, currentPiece.row + 1, currentPiece.col)) {
            handleLock()
          }

          setState(prev => ({
            ...prev,
            score: prev.score + Math.max(0, finalRow - currentPiece.row) * 2,
          }))
          break
        case "p":
        case "P":
          setState(prev => ({ ...prev, isPaused: !prev.isPaused }))
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [tryMove, handleLock, startGame, processLock])

  // --- Rendering Helpers ---

  const renderGrid = () => {
    if (!state.isInitialized) return null

    const gridWithPiece = state.grid.map(row => row.map(cell => ({ ...cell })))

    if (state.currentPiece) {
      const piece = state.currentPiece
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c] !== CLEAR_COLOR) {
            const boardR = piece.row + r
            const boardC = piece.col + c

            if (boardR >= 0 && boardR < GRID_ROWS && boardC >= 0 && boardC < GRID_COLS) {
              const mixedColor = mixColors(
                gridWithPiece[boardR][boardC].color,
                piece.shape[r][c],
              )
              gridWithPiece[boardR][boardC].color = mixedColor
            }
          }
        }
      }
    }

    return (
      <>
        {gridWithPiece.flat().map((cell, index) => {
          const displayColor = cell.color // now only "R" or "E"
          return (
            <div
              key={index}
              className={`transition-colors duration-50 ${COLOR_MAP[displayColor].className} shadow-sm`}
              style={{ width: `${BLOCK_SIZE_PX}px`, height: `${BLOCK_SIZE_PX}px` }}
            />
          )
        })}
      </>
    )
  }

  const renderNextPiece = (piece: Piece | null) => {
    if (!piece) return null
    return (
      <div className="flex flex-col items-center p-3">
        <h3 className="text-xl font-semibold mb-2 text-teal-200">NEXT</h3>
        <div
          className="grid gap-px bg-slate-950 border-2 border-teal-500 rounded-md p-1"
          style={{
            gridTemplateColumns: `repeat(4, 15px)`,
            gridTemplateRows: `repeat(4, 15px)`,
          }}
        >
          {piece.shape.flat().map((color, index) => (
            <div
              key={index}
              className={`rounded-sm ${
                color !== CLEAR_COLOR ? COLOR_MAP[piece.color].className : "bg-slate-950"
              }`}
              style={{ width: "15px", height: "15px" }}
            />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Score", value: state.score, icon: <Trophy className="w-4 h-4" /> },
    { label: "Level", value: state.level, icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <GameWrapper
      title="Color Cascade Puzzle"
      description="Stack blocks and clear lines"
      stats={stats}
    >
      <div className="flex space-x-8 items-start">
        {/* Score Panel */}
        <div className="w-56 p-4 bg-black/60 rounded-2xl shadow-2xl border border-teal-400 text-slate-100 backdrop-blur">
          <div className="text-3xl font-mono mb-2 flex items-center justify-between">
            <LucideDroplet className="w-6 h-6 text-teal-300" />
            <span className="text-teal-200">{state.score}</span>
          </div>
          <div className="text-xl font-mono mb-4 flex items-center justify-between">
            <LucideZap className="w-5 h-5 text-amber-300" />
            <span className="text-amber-200">LEVEL {state.level}</span>
          </div>

          {renderNextPiece(state.nextPiece)}

          <button
            onClick={startGame}
            className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2 rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
          >
            <LucideRedo className="w-4 h-4" />
            <span>RESTART</span>
          </button>
          <p className="text-xs text-center text-slate-400 mt-2">
            Press <span className="font-semibold">P</span> to{" "}
            {state.isPaused ? "UNPAUSE" : "PAUSE"}
          </p>

          <div className="mt-4 text-sm text-slate-300 border-t border-slate-700 pt-2">
            <p className="font-bold text-teal-200 mb-1">Controls:</p>
            <p>← → : Move</p>
            <p>↑ : Rotate</p>
            <p>↓ : Soft Drop</p>
            <p>Space : Hard Drop</p>
            <p className="mt-1 font-bold text-xs text-amber-300">
              Goal: Make a full row of teal blocks to clear!
            </p>
          </div>
        </div>

        {/* Game Grid */}
        <div className="relative">
          <div
            className="grid gap-px bg-slate-900 border-4 border-teal-400 rounded-3xl shadow-[0_0_40px_rgba(45,212,191,0.6)] overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, ${BLOCK_SIZE_PX}px)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, ${BLOCK_SIZE_PX}px)`,
            }}
          >
            {renderGrid()}
          </div>

          {/* Pause / Game Over Overlay */}
          {(state.isGameOver || state.isPaused) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-3xl">
              <h2
                className="text-5xl font-black mb-4 animate-pulse"
                style={{ color: state.isGameOver ? "#f97373" : "#6ee7b7" }}
              >
                {state.isGameOver ? "GAME OVER" : "PAUSED"}
              </h2>
              {state.isGameOver && (
                <p className="text-xl mb-6 text-slate-100">
                  Final Score:{" "}
                  <span className="font-bold text-amber-300">{state.score}</span>
                </p>
              )}
              <button
                onClick={startGame}
                className="bg-teal-400 hover:bg-teal-300 text-slate-900 font-bold py-2.5 px-6 rounded-xl transition shadow-xl"
              >
                {state.isGameOver ? "New Game (Enter)" : "Resume (P)"}
              </button>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
