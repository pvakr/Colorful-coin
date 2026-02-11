"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GameWrapper from "@/components/GameWrapper"
import { Timer, Trophy, Zap } from "lucide-react"
import { motion } from "framer-motion"

const COLORS = ["red", "blue", "green", "yellow", "purple"]
const TILE_COUNT = 25
const ROUND_TIME = 8000

export default function ColorRushGame() {
  const router = useRouter()

  const [tiles, setTiles] = useState<string[]>([])
  const [targetColor, setTargetColor] = useState("")
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState("")
  const [gameState, setGameState] = useState<"intro" | "playing" | "gameOver">("intro")
  const [roundKey, setRoundKey] = useState(0)
  const [isStartOpen, setIsStartOpen] = useState(true)
  const [timeLeft, setTimeLeft] = useState<number>(Math.floor(ROUND_TIME / 1000))
  const [isGameOverOpen, setIsGameOverOpen] = useState(false)
  const [roundClicks, setRoundClicks] = useState(0)
  const [finalScore, setFinalScore] = useState(0)

  const startRound = (resetScore: boolean = false) => {
    const newTiles = Array.from({ length: TILE_COUNT }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
    const validColors = new Set(newTiles)
    const color = Array.from(validColors)[Math.floor(Math.random() * validColors.size)]

    setTiles(newTiles)
    setTargetColor(color)
    setMessage("")
    setGameState("playing")
    setRoundKey((prev) => prev + 1)
    setTimeLeft(Math.floor(ROUND_TIME / 1000))
    setRoundClicks(0)
    if (resetScore) {
      setScore(0)
    }
  }

  useEffect(() => {
    if (gameState !== "playing") return

    if (timeLeft <= 0) {
      setMessage("Time's up! Game Over.")
      setGameState("gameOver")
      setFinalScore(score)
      setIsGameOverOpen(true)
      return
    }

    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(t)
  }, [gameState, timeLeft, score])

  const handleClick = (color: string) => {
    if (gameState !== "playing") return

    if (color === targetColor) {
      setScore((s) => s + 1)
      setMessage("✅ Nice!")
      setRoundClicks((c) => c + 1)
      const targetCount = tiles.filter(c => c === targetColor).length
      if (roundClicks + 1 >= targetCount) {
        setTimeout(() => startRound(false), 500)
      }
    } else {
      setMessage("❌ Wrong! Game Over.")
      setGameState("gameOver")
      setFinalScore(score)
      setIsGameOverOpen(true)
    }
  }

  const getBg = (color: string) =>
    ({
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-400",
      purple: "bg-purple-500",
    })[color]

  const handleRestart = () => {
    setIsGameOverOpen(false)
    setIsStartOpen(true)
    setScore(0)
    setFinalScore(0)
    setGameState("intro")
    setTiles([])
    setMessage("")
  }

  return (
    <GameWrapper
      title="Color Rush"
      description="Click all the target color tiles before time runs out!"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
        { label: "Time", value: `${timeLeft}s`, icon: <Timer className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-3xl">
        {gameState === "playing" && (
          <p className="mt-6 text-xl sm:text-2xl font-semibold text-center text-white">
            Click all <strong className="text-yellow-400">{targetColor.toUpperCase()}</strong> tiles!
          </p>
        )}

        {gameState !== "playing" && message && (
          <p className="mt-6 text-lg font-semibold text-center text-white">{message}</p>
        )}

        <div className="grid grid-cols-5 gap-2 my-6">
          {tiles.map((color, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleClick(color)}
              disabled={gameState !== "playing"}
              className={`w-14 h-14 ${getBg(color)} rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.02 }}
              whileHover={{ scale: gameState === "playing" ? 1.1 : 1 }}
            />
          ))}
        </div>

        <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Color Rush
              </DialogTitle>
              <DialogDescription>
                Click all the tiles of the target color before time runs out.
                <br />
                <strong className="text-red-500">One wrong click or running out of time ends the game!</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => { setIsStartOpen(false); startRound(true) }}>
                Start Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isGameOverOpen} onOpenChange={setIsGameOverOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-500">Game Over!</DialogTitle>
              <DialogDescription>
                Your Final Score: <span className="font-bold text-lg text-yellow-400">{finalScore}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button onClick={handleRestart}>Restart Game</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GameWrapper>
  )

