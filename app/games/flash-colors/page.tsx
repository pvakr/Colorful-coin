"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GameWrapper from "@/components/GameWrapper"
import { CheckCircle, XCircle, Trophy, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashColors() {
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

  const speed = useMemo(() => Math.max(250, 500 - (round - 1) * 20), [round])

  useEffect(() => {
    if (started) {
      startRound()
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [round, started])

  function startRound() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]
    setCorrectWord(word)
    setFlashColor(COLOR_HEX[word])

    const distractors = shuffle(COLOR_WORDS.filter(w => w !== word)).slice(0, 3)
    setChoices(shuffle([word, ...distractors]))

    setVisible(true)
    timerRef.current = window.setTimeout(() => setVisible(false), speed)
    setStatus("waiting")
    setMessage("Tap the correct color name")
  }

  function onSelect(choice: string) {
    if (status !== "waiting" || isFeedbackOpen) return

    if (choice === correctWord) {
      setScore(s => s + 1)
      setStatus("win")
      setMessage("Correct! You earned a point.")
    } else {
      setStatus("gameOver")
      setMessage(`Game Over! The correct color was ${correctWord}.`)
    }

    setIsFeedbackOpen(true)
  }

  const handleNextOrRestart = () => {
    setIsFeedbackOpen(false)
    if (status === "win") {
      setRound(r => r + 1)
    } else {
      setStarted(false)
      setRound(1)
      setScore(0)
      setMessage("Tap the correct color name")
    }
  }

  return (
    <GameWrapper
      title="Flash Colors"
      description="Test your color memory and reflexes!"
      stats={[
        { label: "Round", value: round, icon: <Zap className="w-4 h-4" /> },
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
      ]}
    >
      {!started ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur p-8 shadow-xl text-center"
        >
          {round > 1 && (
            <p className="text-lg font-semibold text-red-400 mb-4">
              Game Over! Final Score: {score}
            </p>
          )}
          <p className="text-white/80 mb-6">Test your color memory and reflexes!</p>
          <Button
            onClick={() => {
              setStarted(true)
              setRound(1)
              setScore(0)
              setMessage("Tap the correct color name")
            }}
            className="bg-white text-black hover:bg-gray-200 shadow-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl rounded-2xl bg-white/10 backdrop-blur p-6 shadow-xl"
        >
          <p className="text-sm text-white/60 mb-4">
            Round {round} · Score {score} · Flash {speed}ms
          </p>

          <div className="h-40 mb-4 rounded-xl border overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={flashColor}
                initial={{ opacity: 0 }}
                animate={{ opacity: visible ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: speed / 1000 }}
                className="h-full w-full"
                style={{ backgroundColor: flashColor }}
              />
            </AnimatePresence>
          </div>

          <p className="mb-3 font-medium text-white">{message}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {choices.map((c, index) => (
              <motion.div
                key={c}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Button
                  key={c}
                  onClick={() => onSelect(c)}
                  className="w-full bg-white/20 backdrop-blur hover:bg-white/30 text-white border border-white/20"
                  disabled={status !== "waiting" || isFeedbackOpen}
                >
                  {c}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

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
              {message}
              {status === "win" && (
                <>
                  <br />
                  <span>Prepare for Round {round + 1}!</span>
                </>
              )}
              {status === "gameOver" && (
                <>
                  <br />
                  <span className="font-bold text-yellow-400">Your Final Score: {score}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button onClick={handleNextOrRestart}>
              {status === "win" ? "Next Round" : "Restart Game"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GameWrapper>
  )
}
