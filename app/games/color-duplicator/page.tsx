"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import GameWrapper from "@/components/GameWrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Zap, Clock, CheckCircle, XCircle } from "lucide-react";
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
    <GameWrapper
      title="Color Duplicator"
      description="Find the duplicated color in the grid!"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
        { label: "Round", value: round, icon: <Target className="w-4 h-4" /> },
        { label: "Time", value: `${timeLeft}s`, icon: <Clock className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 rounded-xl border bg-white/10 backdrop-blur p-4"
        >
          <div className="grid grid-cols-3 gap-4 place-items-center">
            {grid.map((color, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClick(color)}
                disabled={status !== "waiting"}
                className="w-20 h-20 rounded-xl border shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: color }}
                aria-label={`color ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>

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
      </div>
    </GameWrapper>
  );
}