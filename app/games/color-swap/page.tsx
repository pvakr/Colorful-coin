"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const GRID_SIZE = 6
const COLORS = ["red", "blue", "green", "yellow", "purple"]

type Tile = { id: number; color: string }

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function generateGrid(): Tile[][] {
  return Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, col) => ({
      id: Date.now() + row * GRID_SIZE + col,
      color: getRandomColor(),
    })),
  )
}

function cloneGrid(grid: Tile[][]): Tile[][] {
  return grid.map((row) => row.map((tile) => ({ ...tile })))
}

export default function ColorSwapPuzzle() {
  const router = useRouter()
  const [grid, setGrid] = useState<Tile[][]>(generateGrid())
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [score, setScore] = useState(0)

  const handleTileClick = (row: number, col: number) => {
    if (!selected) {
      setSelected([row, col])
    } else {
      const [r1, c1] = selected
      const isAdjacent = Math.abs(r1 - row) + Math.abs(c1 - col) === 1
      if (!isAdjacent) {
        setSelected([row, col])
        return
      }

      const newGrid = cloneGrid(grid)
      ;[newGrid[r1][c1], newGrid[row][col]] = [newGrid[row][col], newGrid[r1][c1]]
      if (hasMatches(newGrid)) {
        setGrid(newGrid)
        setTimeout(() => processMatches(), 100)
      } else {
        setSelected(null)
      }
    }
  }

  const hasMatches = (grid: Tile[][]): boolean => {
    return findMatches(grid).length > 0
  }

  const findMatches = (grid: Tile[][]): [number, number][] => {
    const matches: [number, number][] = []

    // Horizontal
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const color = grid[row][col].color
        if (color && grid[row][col + 1].color === color && grid[row][col + 2].color === color) {
          matches.push([row, col], [row, col + 1], [row, col + 2])
          let k = col + 3
          while (k < GRID_SIZE && grid[row][k].color === color) {
            matches.push([row, k])
            k++
          }
        }
      }
    }

    // Vertical
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const color = grid[row][col].color
        if (color && grid[row + 1][col].color === color && grid[row + 2][col].color === color) {
          matches.push([row, col], [row + 1, col], [row + 2, col])
          let k = row + 3
          while (k < GRID_SIZE && grid[k][col].color === color) {
            matches.push([k, col])
            k++
          }
        }
      }
    }

    return matches
  }

  const processMatches = () => {
    const matchCoords = findMatches(grid)
    if (matchCoords.length === 0) {
      setSelected(null)
      return
    }

    const newGrid = cloneGrid(grid)
    const seen = new Set<string>()
    matchCoords.forEach(([r, c]) => {
      seen.add(`${r}-${c}`)
      newGrid[r][c].color = ""
    })
    setScore((prev) => prev + seen.size)

    // Drop and fill
    for (let col = 0; col < GRID_SIZE; col++) {
      const colors = []
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const color = newGrid[row][col].color
        if (color) colors.push(color)
      }
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const color = colors.shift() || getRandomColor()
        newGrid[row][col].color = color
      }
    }

    setGrid(newGrid)
    setTimeout(() => processMatches(), 300)
  }

  const getBg = (color: string) =>
    ({
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-300",
      purple: "bg-purple-500",
      "": "bg-gray-800",
    })[color]

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-gray-100 relative">
      {/* ✅ Back Button */}
      <div className="fixed top-4 left-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
          onClick={() => router.push("/games")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="w-full max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
        <h1 className="text-4xl font-bold mb-4 text-[#FF6C00]">🧩 Color Swap Puzzle</h1>
        <p className="text-lg mb-4 text-green-300">Score: {score}</p>

        <div className="grid grid-cols-6 gap-1 border-4 border-white">
          {grid.map((row, rIdx) =>
            row.map((tile, cIdx) => {
              const isSelected = selected?.[0] === rIdx && selected?.[1] === cIdx
              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(rIdx, cIdx)}
                  className={`w-12 h-12 ${getBg(tile.color)} rounded-md ${isSelected ? "ring-4 ring-white" : ""}`}
                />
              )
            }),
          )}
        </div>
      </section>
    </main>
  )
}
