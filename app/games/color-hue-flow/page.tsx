"use client"
import React, { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, CheckCircle, XCircle, Slash, Activity, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

// --- TYPE DEFINITIONS ---
type RGB = [number, number, number]
type Variant = 'primary' | 'outline'

type TileType = 'E' | 'A' | 'B' | 'S' | 'T'

interface Tile {
  type: TileType
  sourceColor?: RGB // Only for SOURCE tiles
  computedColor: RGB // Always set
}

type Grid = Tile[][]

interface Position {
  r: number
  c: number
}

interface SourceConfig {
  pos: Position
  color: RGB
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
}

type SolutionStep = { r: number; c: number; type: 'A' | 'B' }

interface LevelConfig {
  sources: SourceConfig[]
  targets: Position[]
  targetColors: RGB[]
  solution?: SolutionStep[] // optional predefined barrier placements
}

interface ModalProps {
  isOpen: boolean
  title: string
  description: string
  children: React.ReactNode
}

interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  className?: string
  variant?: Variant
  disabled?: boolean // ADDED: Disabled prop for better UX
}

// --- CONFIGURATION & CONSTANTS ---
const GRID_SIZE = 6
const CANVAS_SIZE = 360
const PRIMARY_COLORS: { [key: string]: RGB } = {
  R: [255, 0, 0],
  G: [0, 255, 0],
  B: [0, 0, 255],
}
const EMPTY_COLOR: RGB = [255, 255, 255]

// Mock Router for navigation simulation
const router = {
  push: (path: string) => {
    console.log(`Navigating to: ${path}`)
  },
}

// --- UTILITY FUNCTIONS ---
function rgbToStr([r, g, b]: RGB): string {
  return `rgb(${Math.min(255, Math.max(0, r))}, ${Math.min(255, Math.max(0, g))}, ${Math.min(255, Math.max(0, b))})`
}

function mixColors(c1: RGB, c2: RGB): RGB {
  if (c1[0] === EMPTY_COLOR[0] && c1[1] === EMPTY_COLOR[1] && c1[2] === EMPTY_COLOR[2]) return c2
  if (c2[0] === EMPTY_COLOR[0] && c2[1] === EMPTY_COLOR[1] && c2[2] === EMPTY_COLOR[2]) return c1
  return [
    Math.round((c1[0] + c2[0]) / 2),
    Math.round((c1[1] + c2[1]) / 2),
    Math.round((c1[2] + c2[2]) / 2),
  ]
}

function isSameColor(c1: RGB, c2: RGB): boolean {
  return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2]
}

// --- LEVEL DEFINITIONS ---
const LEVELS: LevelConfig[] = [
  // Level 1: Mix R + G at (2,2)
  {
    sources: [
      { pos: { r: 0, c: 2 }, color: PRIMARY_COLORS.R, direction: 'DOWN' },
      { pos: { r: 5, c: 3 }, color: PRIMARY_COLORS.G, direction: 'UP' },
    ],
    targets: [{ r: 2, c: 2 }],
    targetColors: [[128, 128, 0]],
    solution: [
      { r: 3, c: 3, type: 'B' },
      { r: 3, c: 2, type: 'B' },
    ],
  },
  // Level 2: Mix G + B at (4,4); bend B down to reach (4,4)
  {
    sources: [
      { pos: { r: 1, c: 0 }, color: PRIMARY_COLORS.B, direction: 'RIGHT' },
      { pos: { r: 4, c: 5 }, color: PRIMARY_COLORS.G, direction: 'LEFT' },
    ],
    targets: [{ r: 4, c: 4 }],
    targetColors: [[0, 128, 128]],
    solution: [{ r: 1, c: 4, type: 'B' }],
  },
  // Level 3: Mix R + B at (3,1); this layout already routes both into (3,1)
  {
    sources: [
      { pos: { r: 3, c: 0 }, color: PRIMARY_COLORS.R, direction: 'RIGHT' },
      { pos: { r: 5, c: 1 }, color: PRIMARY_COLORS.B, direction: 'UP' },
    ],
    targets: [{ r: 3, c: 1 }],
    targetColors: [[128, 0, 128]],
    solution: [], // No barriers required
  },
  // Level 4: Simple Red flow through target (1,3)
  {
    sources: [{ pos: { r: 0, c: 3 }, color: PRIMARY_COLORS.R, direction: 'DOWN' }],
    targets: [{ r: 1, c: 3 }],
    targetColors: [PRIMARY_COLORS.R],
    solution: [], // No barriers required
  },
]

// --- UI COMPONENTS ---
const Button: React.FC<ButtonProps> = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled} // ADDED: Disabled attribute
      className={`px-6 py-2 rounded-full font-medium transition duration-150 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 
        ${disabled 
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' // Style for disabled
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500' // Style for active
        } ${className}`}
    >
      {children}
    </button>
  )
}

// BLUR-ONLY MODAL (no dark overlay)
const Modal: React.FC<ModalProps> = ({ isOpen, title, description, children }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-transparent"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="p-8">
          <div className="flex items-center gap-3">
            {title.includes('Solved') ? (
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-600" />
            )}
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="mt-3 text-md text-gray-600">{description}</p>
          <div className="mt-8 flex justify-end">{children}</div>
        </div>
      </div>
    </div>
  )
}

// --- GAME LOGIC ---
function calculateFlow(currentGrid: Grid, sources: SourceConfig[]): Grid {
  const newGrid = currentGrid.map((row) => row.map((tile) => ({ ...tile, computedColor: EMPTY_COLOR })))

  const colorStreams: RGB[][][] = Array(GRID_SIZE)
    .fill(0)
    .map(() => Array(GRID_SIZE).fill(0).map(() => [] as RGB[]))

  for (const source of sources) {
    const { r: startR, c: startC } = source.pos
    let currentDir = source.direction
    const color = source.color

    // Source tile itself
    if (newGrid[startR][startC].type === 'S') {
        newGrid[startR][startC].computedColor = color
    }
    
    // First step out of source
    let r = startR
    let c = startC

    if (currentDir === 'DOWN') r = startR + 1
    else if (currentDir === 'UP') r = startR - 1
    else if (currentDir === 'RIGHT') c = startC + 1
    else if (currentDir === 'LEFT') c = startC - 1

    while (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const tile = newGrid[r][c]
      colorStreams[r][c].push(color)

      let nextR = r
      let nextC = c

      if (tile.type === 'A') {
        // '/'
        if (currentDir === 'DOWN') {
          currentDir = 'LEFT'
          nextC = c - 1
        } else if (currentDir === 'UP') {
          currentDir = 'RIGHT'
          nextC = c + 1
        } else if (currentDir === 'RIGHT') {
          currentDir = 'UP'
          nextR = r - 1
        } else if (currentDir === 'LEFT') {
          currentDir = 'DOWN'
          nextR = r + 1
        } else break
      } else if (tile.type === 'B') {
        // '\'
        if (currentDir === 'DOWN') {
          currentDir = 'RIGHT'
          nextC = c + 1
        } else if (currentDir === 'UP') {
          currentDir = 'LEFT'
          nextC = c - 1
        } else if (currentDir === 'RIGHT') {
          currentDir = 'DOWN'
          nextR = r + 1
        } else if (currentDir === 'LEFT') {
          currentDir = 'UP'
          nextR = r - 1
        } else break
      } else {
        // S, T, E: continue straight
        if (currentDir === 'DOWN') nextR = r + 1
        else if (currentDir === 'UP') nextR = r - 1
        else if (currentDir === 'RIGHT') nextC = c + 1
        else if (currentDir === 'LEFT') nextC = c - 1
      }

      r = nextR
      c = nextC
    }
  }

  // Calculate final mixed colors for each cell
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const streams = colorStreams[r][c]
      const currentTile = newGrid[r][c]

      if (currentTile.type === 'S' && currentTile.sourceColor) {
        // Source color is already set above
      } else if (streams.length > 0) {
        // Mix all incoming streams
        const finalColor = streams.reduce((acc, curr) => mixColors(acc, curr), streams[0])
        newGrid[r][c].computedColor = finalColor
      } else if (currentTile.type === 'S') {
         // Should not happen, source color set above
      } else {
        newGrid[r][c].computedColor = EMPTY_COLOR
      }
      
      // Persist the type (E, A, B, T) from the input grid
      newGrid[r][c].type = currentGrid[r][c].type
      if (newGrid[r][c].type === 'S') newGrid[r][c].sourceColor = currentGrid[r][c].sourceColor
    }
  }

  return newGrid
}

const App: React.FC = () => {
  const [level, setLevel] = useState(0)
  const [grid, setGrid] = useState<Grid>([] as Grid)
  const [isSolved, setIsSolved] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const router = useRouter() // ✅ router defined here

  // solution-view state
  const [isShowingSolution, setIsShowingSolution] = useState(false)
  // FIX: Storing the player's grid state *before* solution is applied for restoration
  const playerGridBeforeSolutionRef = useRef<Grid | null>(null)
  const solutionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentLevelConfig = LEVELS[level]

  // --- Initial Setup and Reset ---
  const initializeGrid = useCallback((levelConfig: LevelConfig) => {
    const initialGrid: Grid = Array(GRID_SIZE)
      .fill(0)
      .map(() =>
        Array(GRID_SIZE)
          .fill(0)
          .map(() => ({ type: 'E', computedColor: EMPTY_COLOR })),
      )

    // Sources
    levelConfig.sources.forEach((source) => {
      initialGrid[source.pos.r][source.pos.c] = { type: 'S', sourceColor: source.color, computedColor: source.color }
    })

    // Targets
    levelConfig.targets.forEach((target) => {
      initialGrid[target.r][target.c].type = 'T'
    })

    const flowGrid = calculateFlow(initialGrid, levelConfig.sources)
    setGrid(flowGrid)
    setIsSolved(false)
    setIsModalOpen(false)
    setIsShowingSolution(false)
    playerGridBeforeSolutionRef.current = null // Reset ref
  }, [])

  useEffect(() => {
    if (LEVELS[level]) {
      initializeGrid(LEVELS[level])
    } else {
      setIsModalOpen(true)
    }
    return () => {
      // cleanup timer if leaving the level/component
      if (solutionTimerRef.current) {
        clearTimeout(solutionTimerRef.current)
        solutionTimerRef.current = null
      }
    }
  }, [level, initializeGrid])

  // --- User Interaction ---
  const handleTileClick = (r: number, c: number) => {
    if (isShowingSolution) return // disable during solution view

    const tile = grid[r][c]
    if (tile.type === 'S' || tile.type === 'T') return // immutable

    let newType: TileType = 'E'
    if (tile.type === 'E') newType = 'A'
    else if (tile.type === 'A') newType = 'B'
    else if (tile.type === 'B') newType = 'E'

    // Only update the type, flow calculation will handle the color
    const newGridTypes = grid.map((row, rowIdx) =>
      row.map((t, colIdx) => (rowIdx === r && colIdx === c ? { ...t, type: newType } : t)),
    )

    const flowGrid = calculateFlow(newGridTypes, currentLevelConfig.sources)
    setGrid(flowGrid)
  }

  // --- Validation ---
  const checkSolution = () => {
    if (isShowingSolution) return // Prevents checking solution when in preview mode
    
    let correctTargets = 0
    const totalTargets = currentLevelConfig.targets.length

    currentLevelConfig.targets.forEach((target, index) => {
      const computedColor = grid[target.r][target.c].computedColor
      const requiredColor = currentLevelConfig.targetColors[index]
      if (requiredColor && isSameColor(computedColor, requiredColor)) {
        correctTargets++
      }
    })

    const solved = correctTargets === totalTargets
    setIsSolved(solved)
    if (solved) setCurrentScore((s) => s + 1)
    setIsModalOpen(true)
  }

  // --- Show Solution (5s) ---
  const handleShowSolution = () => {
    const steps = currentLevelConfig.solution || []
    if (!steps.length || isShowingSolution) return

    // CRITICAL FIX: Capture a deep, immutable copy of the current grid for restoration.
    const gridToRestore: Grid = grid.map(row => row.map(tile => ({...tile})));
    playerGridBeforeSolutionRef.current = gridToRestore // Store it in a ref for stable access

    setIsShowingSolution(true)

    // Apply solution barriers on top of player's grid structure (types only)
    const solvedGridTypes = gridToRestore.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        const sol = steps.find((s) => s.r === rIdx && s.c === cIdx)
        return sol ? { ...cell, type: sol.type } : cell // Apply solution type, retain others
      }),
    )

    // Recompute flow with solution in place
    const flowed = calculateFlow(solvedGridTypes, currentLevelConfig.sources)
    setGrid(flowed)

    // Auto-restore after 5 seconds
    if (solutionTimerRef.current) clearTimeout(solutionTimerRef.current)
    solutionTimerRef.current = setTimeout(() => {
      setIsShowingSolution(false)
      // RESTORATION FIX: Use the value stored in the ref to restore the player's grid
      if (playerGridBeforeSolutionRef.current) {
        setGrid(playerGridBeforeSolutionRef.current)
      }
      playerGridBeforeSolutionRef.current = null
      solutionTimerRef.current = null
    }, 5000)
  }

  // --- Game Flow Handlers ---
  const handleNext = () => {
    if (isSolved && level < LEVELS.length - 1) {
      setLevel((l) => l + 1)
    } else {
      // If solved final level, or not solved
      setLevel(0)
      setCurrentScore(0)
      router.push('/games')
    }
    setIsModalOpen(false)
  }

  const handleRestart = () => {
    setLevel(0)
    setCurrentScore(0)
    initializeGrid(LEVELS[0])
    setIsModalOpen(false)
  }

  const handleBackToGames = () => {
    router.push("/games") // ✅ Navigate back
  }

  // --- Component Rendering ---
  const renderTileContent = (tile: Tile, levelConfig: LevelConfig, r: number, c: number) => {
    switch (tile.type) {
      case 'S':
        return <Activity className="w-5 h-5 text-white" />
      case 'A':
        return <Slash className="w-full h-full text-indigo-800 rotate-[30deg] p-1" />
      case 'B':
        return <Slash className="w-full h-full text-indigo-800 rotate-[150deg] p-1" />
      case 'T': {
        const targetIndex = levelConfig.targets.findIndex((t) => t.r === r && t.c === c)
        if (targetIndex === -1) return null
        const targetColor = levelConfig.targetColors[targetIndex]!
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div
              className="w-4 h-4 rounded-full border-2 border-gray-900"
              style={{ backgroundColor: rgbToStr(targetColor) }}
            />
          </div>
        )
      }
      default:
        return null
    }
  }

  const currentTileSize = `w-14 h-14 sm:w-16 sm:h-16`
  const isFinalLevel = level === LEVELS.length - 1

  return (
    <main className="min-h-screen flex flex-col items-center justify-center antialiased">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-10">
        <button onClick={handleBackToGames} className="flex items-center text-gray-700 hover:text-indigo-600 transition">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Games
        </button>
      </div>

      <section className="w-full max-w-lg">
        <div className="flex flex-col items-center gap-2 mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center text-indigo-600">
            Hue Flow Logic Puzzle
          </h1>
          <div className="flex gap-4 text-gray-700 font-medium">
            <span>
              Level: {level + 1} / {LEVELS.length}
            </span>
            <span>Score: {currentScore}</span>
          </div>
        </div>

        <p className="text-lg text-center text-gray-700 mb-6">
          Click on empty cells to place barriers (`/` or `\`) and guide the color flow to match the target colors.
        </p>

        {/* Grid */}
        <div
          className={`mx-auto border-4 border-gray-600 shadow-xl ${isShowingSolution ? 'pointer-events-none opacity-95' : ''}`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((tile, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                onClick={() => handleTileClick(rIdx, cIdx)}
                className={`relative flex items-center justify-center border-gray-300 border transition-colors cursor-pointer ${currentTileSize} 
                            ${tile.type === 'S' || tile.type === 'T' ? 'cursor-default' : ''}`}
                style={{ backgroundColor: rgbToStr(tile.computedColor) }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-lg">
                  {renderTileContent(tile, currentLevelConfig, rIdx, cIdx)}
                </div>
              </div>
            )),
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-3">
          <Button 
            onClick={checkSolution} 
            className="text-lg px-6 py-3"
            disabled={isShowingSolution} // FIX: Disable while showing solution
          >
            Check Solution
          </Button>
          <Button onClick={handleShowSolution} className="text-lg px-6 py-3 bg-gray-700 hover:bg-gray-800">
            <Eye className="w-4 h-4 mr-2 inline" />
            Show Solution (5s)
          </Button>
        </div>
      </section>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={isSolved ? 'Level Solved!' : 'Incorrect Flow'}
        description={
          isSolved
            ? `Fantastic! You successfully guided the flows to match the target colors. Ready for the next level.`
            : `The resulting color flow did not match all the targets. Review your barrier placements and try again!`
        }
      >
        <Button onClick={isSolved ? handleNext : handleRestart}>
          {isSolved ? (isFinalLevel ? 'Finish Game' : 'Next Level') : 'Restart Level 1'}
        </Button>
      </Modal>
    </main>
  )
}

export default App