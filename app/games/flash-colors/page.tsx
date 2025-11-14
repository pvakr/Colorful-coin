"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const COLOR_HEX: Record<string, string> = {
  Red: "#ef4444",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Yellow: "#eab308",
  Purple: "#a855f7",
  Orange: "#f97316",
  Pink: "#ec4899",
  Cyan: "#06b6d4",
}

const COLOR_WORDS = Object.keys(COLOR_HEX)

export default function FlashColors() {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [flashColor, setFlashColor] = useState<string>("#ffffff")
  const [correctWord, setCorrectWord] = useState<string>("Red")
  const [choices, setChoices] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<"waiting" | "win" | "gameOver">("waiting")
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [message, setMessage] = useState("Tap the correct color name")
  const timerRef = useRef<number | null>(null)

  // Speed decreases as the round increases (max speed 250ms)
  const speed = useMemo(() => Math.max(250, 500 - (round - 1) * 20), [round])

  useEffect(() => {
    if (started) {
      startRound()
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, started])

  function startRound() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]
    setCorrectWord(word)
    setFlashColor(COLOR_HEX[word])

    const distractors = shuffle(COLOR_WORDS.filter(w => w !== word)).slice(0, 3)
    setChoices(shuffle([word, ...distractors]))

    setVisible(true)
    // Flash the color for the calculated speed
    timerRef.current = window.setTimeout(() => setVisible(false), speed)
    setStatus("waiting") // Ensure status is waiting before the flash
    setMessage("Tap the correct color name")
  }

  function onSelect(choice: string) {
    if (status !== "waiting" || isFeedbackOpen) return // Prevent multiple clicks

    if (choice === correctWord) {
      // Correct: Set win status and open dialog
      setScore(s => s + 1)
      setStatus("win")
      setMessage("Correct! You earned a point.")
    } else {
      // Incorrect: Set game over status and open dialog
      setStatus("gameOver")
      setMessage(`Game Over! The correct color was ${correctWord}.`)
    }
    
    setIsFeedbackOpen(true)
  }
  
  const handleNextOrRestart = () => {
    setIsFeedbackOpen(false)
    if (status === "win") {
      // Continue to next round
      setRound(r => r + 1)
    } else if (status === "gameOver") {
      // Restart the entire game
      setStarted(false)
      setRound(1)
      setScore(0)
      setMessage("Tap the correct color name")
    }
  }

  const handleBack = () => {
    router.push("/games")
  }

  return (
    <div>
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-10">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 border text-black"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 p-6">

      {!started ? (
        <section className="w-full max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-8 shadow-xl text-center">
          <h1 className="text-2xl font-bold mb-4">🎨 Flash Colors</h1>
          {round > 1 && <p className="text-lg font-semibold text-red-600 mb-4">Game Over! Final Score: {score}</p>}
          <p className="text-gray-600 mb-6">Test your color memory and reflexes!</p>
          <Button
              onClick={() => {
                setStarted(true)
                setRound(1)
                setScore(0)
                setMessage("Tap the correct color name")
              }}
              className="bg-black text-white border hover:bg-gray-800"
            >
              Start Game
            </Button>
        </section>
      ) : (
        <section className="w-full max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
          <h1 className="text-xl font-bold mb-2">Flash Colors</h1>
          <p className="text-sm opacity-70 mb-4">
            Round {round} · Score {score} · Flash {speed}ms
          </p>

          <div className="h-40 mb-4 rounded-xl border overflow-hidden">
            <div
              className="h-full w-full transition-opacity duration-100"
              style={{ backgroundColor: flashColor, opacity: visible ? 1 : 0 }}
            />
          </div>

          <p className="mb-3 font-medium">{message}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {choices.map(c => (
                <Button
                  key={c}
                  onClick={() => onSelect(c)}
                  className="bg-black text-white border hover:bg-gray-800"
                  // Disable selection while waiting for the next round or if dialog is open
                  disabled={status !== "waiting" || isFeedbackOpen} 
                >
                  {c}
                </Button>
              ))}
           </div>
        </section>
      )}
    </main>
    
    {/* Feedback Dialog (Popup) */}
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
                Game Over
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {/* The primary message is rendered first by DialogDescription's intrinsic <p> */}
            {message}
            
            {/* FIX APPLIED HERE: Use <br /> and <span> tags to ensure valid nesting inside <p> */}
            {status === "win" && (
              <>
                <br />
                <span>Prepare for Round {round + 1}!</span>
              </>
            )}
            {status === "gameOver" && (
              <>
                <br />
                <span className="font-bold">Your Final Score: {score}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back to Games
          </Button>
          <Button onClick={handleNextOrRestart}>
            {status === "win" ? "Next Round" : "Restart Game"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  )
}

// Shuffle helper function
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}