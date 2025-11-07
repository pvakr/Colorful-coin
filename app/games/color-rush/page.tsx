"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const COLORS = ["red", "blue", "green", "yellow", "purple"]
const TILE_COUNT = 25
const ROUND_TIME = 5000

export default function ColorRushGame() {
  const router = useRouter() // ✅ router defined here

  const [tiles, setTiles] = useState<string[]>([])
  const [targetColor, setTargetColor] = useState("")
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState("")
  const [gameState, setGameState] = useState<"intro" | "playing" | "roundOver">("intro")
  const [roundKey, setRoundKey] = useState(0)
  const [isStartOpen, setIsStartOpen] = useState(true)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(Math.floor(ROUND_TIME / 1000))
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [roundClicks, setRoundClicks] = useState(0)

  const startRound = () => {
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
  }

  // countdown tick
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      startRound()
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // time left during round
  useEffect(() => {
    if (gameState !== "playing" || countdown !== null) return
    if (timeLeft <= 0) {
      setMessage("Time’s up!")
      setGameState("roundOver")
      setIsResultOpen(true)
      return
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(t)
  }, [gameState, timeLeft, countdown])

  const handleClick = (color: string) => {
    if (gameState !== "playing") return

    if (color === targetColor) {
      setScore((s) => s + 1)
      setMessage("✅ Nice!")
      setRoundClicks((c) => c + 1)
    } else {
      setMessage("❌ Wrong!")
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

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to games
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
      <section className="w-full max-w-3xl">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Rush Reaction</h1>
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
            <span>Score</span>
            <span className="font-semibold">{score}</span>
          </span>
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
            <Timer className="w-3.5 h-3.5" />
            <span>{gameState === "playing" ? `${timeLeft}s` : ""}</span>
          </span>
        </div>

        {gameState === "playing" && (
          <p className="mt-6 text-xl sm:text-2xl font-semibold text-center">
            Click all <strong>{targetColor.toUpperCase()}</strong> tiles!
          </p>
        )}

        {gameState !== "playing" && message && (
          <p className="mt-6 text-lg font-semibold text-center">{message}</p>
        )}

        <div className="grid grid-cols-5 gap-2 my-6">
          {tiles.map((color, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(color)}
              disabled={gameState !== "playing"}
              className={`w-14 h-14 ${getBg(color)} rounded shadow-lg transition-transform hover:scale-105 active:scale-95`}
            />
          ))}
        </div>

        {/* Start dialog with countdown trigger */}
        <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Start Game</DialogTitle>
              <DialogDescription>Click start to begin. You have 5 seconds each round.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => { setIsStartOpen(false); setCountdown(3); }}>Start</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-7xl font-extrabold text-white">{countdown}</div>
          </div>
        )}

        {/* Result dialog */}
        <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Round Over</DialogTitle>
              <DialogDescription>
                Score: <span className="font-semibold">{score}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>Back to Games</Button>
              {roundClicks > 0 ? (
                <Button onClick={() => { setIsResultOpen(false); setCountdown(3); }}>
                  Next Round
                </Button>
              ) : (
                <Button onClick={() => { setIsResultOpen(false); setIsStartOpen(true); }}>
                  Restart Game
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
    </div>
  )
}
