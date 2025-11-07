"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const COLORS = ["red", "blue", "green", "yellow", "purple"]
const DOT_COUNT = 30
const DISPLAY_DURATION = 4000 // ms

export default function ColorCountQuiz() {
  const router = useRouter() // ✅ router defined here

  const [dots, setDots] = useState<{ x: number; y: number; color: string }[]>([])
  const [targetColor, setTargetColor] = useState("")
  const [options, setOptions] = useState<number[]>([])
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [showDots, setShowDots] = useState(true)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [questionKey, setQuestionKey] = useState(0)

  const startNewRound = () => {
    const newDots = Array.from({ length: DOT_COUNT }, () => ({
      x: Math.random() * 90,
      y: Math.random() * 60 + 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))
    const target = COLORS[Math.floor(Math.random() * COLORS.length)]
    const count = newDots.filter((d) => d.color === target).length

    // Create answer options (ensure 4 unique options always)
    const fake1 = Math.max(0, Math.min(DOT_COUNT, count + (Math.floor(Math.random() * 3) - 1)))
    const fake2 = Math.max(0, Math.min(DOT_COUNT, count + (Math.floor(Math.random() * 4) - 2)))
    const fake3 = Math.max(0, Math.min(DOT_COUNT, count + (Math.floor(Math.random() * 5) - 2)))
    const optSet = new Set<number>([count, fake1, fake2, fake3])
    while (optSet.size < 4) {
      const candidate = Math.floor(Math.random() * (DOT_COUNT + 1))
      if (!optSet.has(candidate)) optSet.add(candidate)
    }
    const optList = Array.from(optSet).sort(() => Math.random() - 0.5)

    setDots(newDots)
    setTargetColor(target)
    setCorrectAnswer(count)
    setOptions(optList)
    setShowDots(true)
    setFeedback("")
    setQuestionKey((k) => k + 1)
  }

  useEffect(() => {
    startNewRound()
  }, [])

  useEffect(() => {
    if (!showDots) return
    const timeout = setTimeout(() => {
      setShowDots(false)
    }, DISPLAY_DURATION)
    return () => clearTimeout(timeout)
  }, [questionKey])

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      setScore((s) => s + 1)
      setFeedback("Correct!")
    } else {
      setFeedback(`Wrong! It was ${correctAnswer}`)
    }
    setIsFeedbackOpen(true)
  }

  const getBg = (color: string) =>
    ({
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-300",
      purple: "bg-purple-500",
    })[color]

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to /games
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
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Count Quiz</h1>
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
            <span>Score</span>
            <span className="font-semibold">{score}</span>
          </span>
        </div>

        <p className="mt-6 text-xl sm:text-2xl font-semibold text-center">
          {showDots ? `Memorize the count of ${targetColor.toUpperCase()} dots!` : `How many ${targetColor.toUpperCase()} dots did you see?`}
        </p>

        <div className="relative w-full h-[400px] mt-6 rounded border-2 overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.7)" }}>
          {showDots &&
            dots.map((dot, idx) => (
              <div
                key={idx}
                className={`absolute w-6 h-6 rounded-full ${getBg(dot.color)}`}
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              />
            ))}
        </div>

        {!showDots && (
          <div className="grid grid-cols-2 gap-4 mt-8">
            {options.map((num, idx) => {
              const bg = [
                "bg-emerald-500",
                "bg-sky-500",
                "bg-amber-500",
                "bg-fuchsia-500",
              ][idx % 4]
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(num)}
                  className={`px-6 py-4 rounded-xl text-white text-2xl font-semibold shadow-md hover:scale-[1.03] active:scale-95 transition-transform ${bg}`}
                  aria-label={`answer ${num}`}
                >
                  {num}
                </button>
              )
            })}
          </div>
        )}

        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                {feedback.startsWith("Correct") ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                {feedback}
              </DialogTitle>
              <DialogDescription>
                {feedback.startsWith("Correct") ? "+1 score" : "Try the next one"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>Back to Games</Button>
              <Button onClick={() => { setIsFeedbackOpen(false); startNewRound(); }}>Next Round</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  )
}
