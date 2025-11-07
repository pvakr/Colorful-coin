"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const COLORS = ["#FF6C00", "#00FFB3", "#FF003C", "#7D4AFF", "#00E4FF", "#FFEA00", "#00FF66", "#FF66CC"]

function shuffle(array: string[]): string[] {
  let currentIndex = array.length,
    randomIndex
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }
  return array
}

export default function ColorMatcherPage() {
  const router = useRouter()

  const [tiles, setTiles] = useState<
    {
      id: number
      color: string
      flipped: boolean
      matched: boolean
    }[]
  >([])

  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [score, setScore] = useState<number>(0)
  const [round, setRound] = useState<number>(1)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)

  const initializeTiles = () => {
    const colorPairs = shuffle([...COLORS, ...COLORS])
    const initialTiles = colorPairs.map((color, index) => ({
      id: index,
      color,
      flipped: false,
      matched: false,
    }))
    setTiles(initialTiles)
    setFlipped([])
    setMatched([])
    setIsCompleteOpen(false)
  }

  useEffect(() => {
    initializeTiles()
  }, [])

  useEffect(() => {
    if (matched.length === COLORS.length * 2 && tiles.length) {
      setIsCompleteOpen(true)
    }
  }, [matched, tiles.length])

  const handleClick = (index: number) => {
    if (flipped.length === 2 || tiles[index].flipped || tiles[index].matched) return

    const newTiles = [...tiles]
    newTiles[index].flipped = true
    setTiles(newTiles)

    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped
      if (tiles[firstIdx].color === tiles[secondIdx].color) {
        setTimeout(() => {
          const updatedTiles = [...tiles]
          updatedTiles[firstIdx].matched = true
          updatedTiles[secondIdx].matched = true
          setTiles(updatedTiles)
          setMatched([...matched, firstIdx, secondIdx])
          setScore((s) => s + 1)
          setFlipped([])
        }, 500)
      } else {
        setTimeout(() => {
          const updatedTiles = [...tiles]
          updatedTiles[firstIdx].flipped = false
          updatedTiles[secondIdx].flipped = false
          setTiles(updatedTiles)
          setFlipped([])
        }, 1000)
      }
    }
  }

  const handleBack = () => {
    router.push("/games")
  }

  return (
    <div>
      <div className="fixed top-6 left-6">
        <Button variant="outline" size="sm" className="bg-transparent hover:bg-transparent border px-3" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <section className="w-full max-w-3xl text-center">
        <div className="flex flex-col items-center gap-3 mb-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Color Matcher</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Score</span>
              <span className="font-semibold">{score}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Round</span>
              <span className="font-semibold">{round}</span>
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md grid grid-cols-4 gap-1">
          {tiles.map((tile, index) => (
            <div
              key={tile.id}
              onClick={() => handleClick(index)}
              className={`w-full aspect-square rounded-md border border-white/40 transition-transform duration-300 ease-in-out ${
                tile.flipped || tile.matched ? "rotate-y-0" : "rotate-y-180"
              }`}
              style={{
                backgroundColor: tile.flipped || tile.matched ? tile.color : "gray",
                cursor: tile.flipped || tile.matched ? "default" : "pointer",
              }}
            />
          ))}
        </div>

        <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Round Complete</DialogTitle>
              <DialogDescription>
                Score: <span className="font-semibold">{score}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/games")}
              >
                Back to Games
              </Button>
              <Button
                onClick={() => {
                  setIsCompleteOpen(false)
                  setRound((r) => r + 1)
                  initializeTiles()
                }}
              >
                Next Round
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
      </main>
    </div>
  )
}
