"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GameWrapper from "@/components/GameWrapper"
import { Trophy } from "lucide-react"

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

  return (
    <GameWrapper
      title="Color Matcher"
      description="Match the colors to complete the puzzle"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
        { label: "Round", value: round },
      ]}
    >
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto w-full max-w-md grid grid-cols-4 gap-1">
          {tiles.map((tile, index) => (
            <motion.div
              key={tile.id}
              onClick={() => handleClick(index)}
              className={`w-full aspect-square rounded-md border border-white/40 transition-transform duration-300 ease-in-out cursor-pointer ${
                tile.flipped || tile.matched ? "rotate-y-0" : "rotate-y-180"
              }`}
              style={{
                backgroundColor: tile.flipped || tile.matched ? tile.color : "#374151",
                cursor: tile.flipped || tile.matched ? "default" : "pointer",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              whileHover={{ scale: tile.flipped || tile.matched ? 1 : 1.05 }}
            />
          ))}
        </div>

        <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Round Complete!</DialogTitle>
              <DialogDescription>
                Score: <span className="font-semibold">{score}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
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
      </div>
    </GameWrapper>
  )
}

// Import motion for animations
import { motion } from "framer-motion"
