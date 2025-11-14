"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle } from "lucide-react"
import "../../globals.css"

const baseColors = ["#FF6C00", "#00FFB3", "#FF003C", "#7D4AFF", "#00E4FF", "#FFEA00", "#00FF66", "#FF66CC"]

export default function ColorDuplicator() {
  const router = useRouter()

  const [grid, setGrid] = useState<string[]>([])
  const [duplicated, setDuplicated] = useState<string>("")
  const [status, setStatus] = useState<"waiting" | "win" | "gameOver">("waiting") 
  const [round, setRound] = useState<number>(1)
  const [score, setScore] = useState<number>(0)
  const [finalScore, setFinalScore] = useState<number>(0)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(5)

  // Function to encapsulate the round setup logic
  const startNewRound = (currentRound: number) => {
    const original = [...baseColors].sort(() => 0.5 - Math.random()).slice(0, 8)
    const dup = original[Math.floor(Math.random() * original.length)]
    const newGrid = [...original, dup].sort(() => 0.5 - Math.random())
    setGrid(newGrid)
    setDuplicated(dup)
    setStatus("waiting") // Crucial: Reset status to "waiting"
    setTimeLeft(5)
    setRound(currentRound);
  }

  // Initial load or round change
  useEffect(() => {
    // Call startNewRound whenever 'round' changes, ensuring a fresh setup
    startNewRound(round)
  }, [round])

  // 5s round timer - Modified for Game Over
  useEffect(() => {
    // Only run timer if status is 'waiting' and dialog is closed
    if (status !== "waiting" || isFeedbackOpen) return
    
    if (timeLeft <= 0) {
      // Game Over on time ran out
      setStatus("gameOver")
      setFinalScore(score)
      setIsFeedbackOpen(true)
      return
    }
    
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, status, isFeedbackOpen, score])

  const handleClick = (color: string) => {
    // CRITICAL FIX: Prevent clicks if status is not 'waiting' OR dialog is open
    if (status !== "waiting" || isFeedbackOpen) return

    const count = grid.filter((c) => c === color).length

    if (count === 2 && color === duplicated) {
      // Correct click
      setStatus("win")
      setScore((s) => s + 1)
      setIsFeedbackOpen(true)
    } else {
      // Wrong click: Game Over
      setStatus("gameOver")
      setFinalScore(score)
      setIsFeedbackOpen(true)
    }
  }

  const handleNextOrRestart = () => {
    setIsFeedbackOpen(false)
    if (status === "win") {
      // Continue to next round (updating round triggers useEffect)
      setRound((r) => r + 1)
    } else if (status === "gameOver") {
      // Restart the entire game: Reset score, and explicitly start Round 1
      setScore(0)
      startNewRound(1) // FIX: Call startNewRound directly here to ensure immediate setup
    }
  }

  const handleBack = () => {
    router.push("/games")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed top-6 left-6">
        <Button variant="outline" size="sm" className="bg-transparent hover:bg-transparent border px-3" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="w-full max-w-3xl">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Duplicator</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Score</span>
              <span className="font-semibold">{score}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Round</span>
              <span className="font-semibold">{round}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Time</span>
              <span className="font-semibold">{timeLeft}s</span>
            </span>
          </div>
          <p className="text-base sm:text-lg">Tap the **duplicated color**</p>
        </div>

        <div className="mt-6 rounded-xl border p-4">
          <div className="grid grid-cols-3 gap-4 place-items-center">
          {grid.map((color, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(color)}
              // Disable buttons when not waiting for input
              disabled={status !== "waiting"} 
              className="w-20 h-20 rounded-xl border shadow-sm hover:scale-105 transition-transform"
              style={{ backgroundColor: color }}
              aria-label={`color ${idx + 1}`}
            />
          ))}
          </div>
        </div>

        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                {status === "win" ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    Game Over!
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {status === "win" 
                  ? `Success! You earned a point and advanced to Round ${round + 1}.` 
                  : `Incorrect choice or time ran out. Your final score is: ${finalScore}.`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>Back to Games</Button>
              <Button onClick={handleNextOrRestart}>
                {status === "win" ? "Next Round" : "Restart Game"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  )
}