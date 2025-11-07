"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import "../../globals.css"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const colorSet = ["#FF6C00", "#00FFB3", "#FF003C", "#7D4AFF", "#00E4FF", "#FFEA00", "#00FF66", "#FF66CC"]

export default function ColorFrequency() {
  const router = useRouter() // ✅ router defined here

  const [sequence, setSequence] = useState<string[]>([])
  const [input, setInput] = useState<string[]>([])
  const [isShowing, setIsShowing] = useState(true)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const generateSequence = (length: number): string[] => {
    const shuffled = [...colorSet].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, length)
  }

  useEffect(() => {
    const newSeq = generateSequence(level)
    console.log("New sequence:", newSeq)
    setSequence(newSeq)
    setIsShowing(true)
    setInput([])

    const timer = setTimeout(() => setIsShowing(false), 1500 + level * 400)
    return () => clearTimeout(timer)
  }, [level])

  // Start input countdown once sequence is hidden
  useEffect(() => {
    if (isShowing) {
      setTimeLeft(null)
      return
    }
    // give 8s to respond
    setTimeLeft(8)
  }, [isShowing])

  useEffect(() => {
    if (timeLeft === null) return
    if (isShowing || isFeedbackOpen) return
    if (timeLeft <= 0) {
      setFeedback("Time's up!")
      setIsFeedbackOpen(true)
      return
    }
    const t = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : t)), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, isShowing, isFeedbackOpen])

  const handleClick = (color: string) => {
    if (isShowing) return
    const newInput = [...input, color]
    setInput(newInput)
    if (newInput.join("") === sequence.join("")) {
      setFeedback("Correct!")
      setIsFeedbackOpen(true)
      setScore((s) => s + level)
    } else if (!sequence.join("").startsWith(newInput.join(""))) {
      setFeedback("Wrong!")
      setIsFeedbackOpen(true)
      setScore(0)
    }
  }

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back
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
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Frequency</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Level</span>
              <span className="font-semibold">{level}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Score</span>
              <span className="font-semibold">{score}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <Timer className="w-3.5 h-3.5" />
              <span>{timeLeft !== null ? `${timeLeft}s` : ""}</span>
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          {isShowing && sequence.map((color, idx) => (
            <div key={idx} className="w-14 h-14 rounded-md border" style={{ backgroundColor: color }} />
          ))}
        </div>

        {!isShowing && (
          <div className="mt-8 grid grid-cols-4 gap-4 place-items-center">
            {colorSet.map((color) => (
              <button
                key={color}
                className="w-14 h-14 rounded-md border"
                style={{ backgroundColor: color }}
                onClick={() => handleClick(color)}
                aria-label={`color ${color}`}
              />
            ))}
          </div>
        )}

        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                {feedback === "Correct!" ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                {feedback}
              </DialogTitle>
              <DialogDescription>
                {feedback === "Correct!" ? `+${level} score` : "Try again next round"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>Back to Games</Button>
              <Button
                onClick={() => {
                  setIsFeedbackOpen(false)
                  if (feedback === "Correct!") {
                    setLevel((l) => l + 1)
                  } else {
                    setLevel(1)
                  }
                  setFeedback(null)
                  setTimeLeft(null)
                }}
              >
                Next Round
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  )
}
