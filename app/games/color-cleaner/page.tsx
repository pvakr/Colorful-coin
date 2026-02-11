"use client"
import { useEffect, useState } from "react"
import GameWrapper from "@/components/GameWrapper"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Trophy, Target, Zap, Heart } from "lucide-react"

const COLORS = ["red", "blue", "green", "yellow", "purple"]
const MAX_LIVES = 3
const SPAWN_INTERVAL = 1000
const FADE_DURATION = 3000

type Blob = {
  id: number
  color: string
  x: number
  y: number
  createdAt: number
}

export default function FadingColorCleaner() {
  const [blobs, setBlobs] = useState<Blob[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    if (gameOver) return

    const spawn = setInterval(() => {
      const newBlob: Blob = {
        id: Date.now(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        x: Math.random() * 90,
        y: Math.random() * 60 + 20,
        createdAt: Date.now(),
      }
      setBlobs((prev) => [...prev, newBlob])
    }, SPAWN_INTERVAL)

    return () => clearInterval(spawn)
  }, [gameOver])

  useEffect(() => {
    const check = setInterval(() => {
      const now = Date.now()
      setBlobs((prev) => {
        const stillVisible: Blob[] = []
        let missed = 0

        for (const blob of prev) {
          if (now - blob.createdAt > FADE_DURATION) {
            if (blob.color === "red") {
              missed++
            }
          } else {
            stillVisible.push(blob)
          }
        }

        if (missed > 0) {
          setLives((l) => {
            const newLives = l - missed
            if (newLives <= 0) setGameOver(true)
            return newLives
          })
        }

        return stillVisible
      })
    }, 500)

    return () => clearInterval(check)
  }, [])

  const handleClick = (id: number) => {
    setBlobs((prev) => prev.filter((b) => b.id !== id))
    setScore((s) => s + 1)
  }

  const getBg = (color: string) =>
    ({
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-400",
      purple: "bg-purple-500",
    })[color]

  const resetGame = () => {
    setScore(0)
    setLives(MAX_LIVES)
    setBlobs([])
    setGameOver(false)
  }

  return (
    <GameWrapper
      title="Fading Color Cleaner"
      description="Tap the colored blobs before they fade away!"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
        { label: "Lives", value: lives, icon: <Heart className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {!gameOver && (
            <p className="text-center text-base sm:text-lg mb-4">Tap the colored blobs before they fade away.</p>
          )}

          <div className="relative w-full h-[500px] mx-auto bg-slate-900/50 backdrop-blur rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl">
            {blobs.map((blob) => (
              <motion.button
                key={blob.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleClick(blob.id)}
                className={`absolute w-12 h-12 rounded-full ${getBg(blob.color)} shadow-lg`}
                style={{
                  top: `${blob.y}%`,
                  left: `${blob.x}%`,
                }}
              />
            ))}
          </div>
        </motion.div>

        <Dialog open={gameOver}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Game Over</DialogTitle>
              <DialogDescription>
                Your score: <span className="font-semibold">{score}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button onClick={resetGame}>Restart</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GameWrapper>
  )
}
