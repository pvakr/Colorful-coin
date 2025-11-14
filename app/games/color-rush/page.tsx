"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const COLORS = ["red", "blue", "green", "yellow", "purple"]
const TILE_COUNT = 25
// Increase the round time slightly for better initial play experience
const ROUND_TIME = 8000 

export default function ColorRushGame() {
  const router = useRouter()

  const [tiles, setTiles] = useState<string[]>([])
  const [targetColor, setTargetColor] = useState("")
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState("")
  // Removed "roundOver" state, now directly uses "gameOver"
  const [gameState, setGameState] = useState<"intro" | "playing" | "gameOver">("intro") 
  const [roundKey, setRoundKey] = useState(0)
  const [isStartOpen, setIsStartOpen] = useState(true)
  // Removed [countdown] state
  const [timeLeft, setTimeLeft] = useState<number>(Math.floor(ROUND_TIME / 1000))
  // Renamed to reflect final game over
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

  // time left during round - modified for Game Over logic
  useEffect(() => {
    if (gameState !== "playing") return
    
    if (timeLeft <= 0) {
      setMessage("Time's up! Game Over.")
      setGameState("gameOver")
      setFinalScore(score) // Capture final score
      setIsGameOverOpen(true) // Open the Game Over dialog
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
      // Check if all target tiles have been clicked (simple check based on count vs tiles)
      const targetCount = tiles.filter(c => c === targetColor).length;
      if (roundClicks + 1 >= targetCount) {
        // Automatically start the next round if all are clicked
        setTimeout(() => startRound(false), 500); 
      }
    } else {
      setMessage("❌ Wrong! Game Over.")
      setGameState("gameOver")
      setFinalScore(score) // Capture final score
      setIsGameOverOpen(true) // Open the Game Over dialog
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
    router.push("/games")
  }

  const handleRestart = () => {
    setIsGameOverOpen(false)
    setIsStartOpen(true) // Go back to the intro dialog to start afresh
    setScore(0)
    setFinalScore(0)
    setGameState("intro")
    setTiles([])
    setMessage("")
  }

  return (
    <div>
      <div className="fixed top-6 left-6 z-10">
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
          {gameState === "playing" && (
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <Timer className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </span>
          )}
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

        {/* Start dialog (intro) - removed countdown trigger */}
        <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Color Rush</DialogTitle>
              <DialogDescription>
                Click start to begin. Click all the tiles of the target color before time runs out. 
                <br />**One wrong click or running out of time ends the game!**
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => { setIsStartOpen(false); startRound(true); }}>
                Start Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Removed Countdown overlay */}

        {/* Game Over dialog - formerly Result dialog */}
        <Dialog open={isGameOverOpen} onOpenChange={setIsGameOverOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Game Over!</DialogTitle>
              <DialogDescription>
                Your Final Score: <span className="font-bold text-lg text-red-600">{finalScore}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>Back to Games</Button>
              <Button onClick={handleRestart}>
                Restart Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
    </div>
  )
}