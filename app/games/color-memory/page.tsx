"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  }

  useEffect(() => {
    initializeTiles()
  }, [])

  useEffect(() => {
    if (matched.length === COLORS.length * 2) {
      setTimeout(() => {
        initializeTiles()
      }, 1500)
    }
  }, [matched])

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
      {/* Back Button positioned at the top left slightly */}
      <div className="fixed top-30 left-60">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 border border-yellow text-black"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 p-6">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl text-center">
        <h1 className="text-4xl font-bold mb-6 text-[#FF6C00] drop-shadow-md">
          🎨 Color Matcher Game
        </h1>

        <div className="grid grid-cols-4 gap-4 justify-center">
          {tiles.map((tile, index) => (
            <div
              key={tile.id}
              onClick={() => handleClick(index)}
              className="w-20 h-20 rounded-xl border-2 border-white transition-all duration-300 ease-in-out shadow-md hover:scale-105"
              style={{
                backgroundColor: tile.flipped || tile.matched ? tile.color : "gray",
                cursor: tile.flipped || tile.matched ? "default" : "pointer",
              }}
            />
          ))}
        </div>
      </section>
      </main>
    </div>
  )
}
