"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [questionKey, setQuestionKey] = useState(0)

  const startNewRound = () => {
    const newDots = Array.from({ length: DOT_COUNT }, () => ({
      x: Math.random() * 90,
      y: Math.random() * 60 + 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))
    const target = COLORS[Math.floor(Math.random() * COLORS.length)]
    const count = newDots.filter((d) => d.color === target).length

    // Create answer options
    const fake1 = Math.max(0, count + (Math.floor(Math.random() * 3) - 1))
    const fake2 = Math.max(0, count + (Math.floor(Math.random() * 4) - 2))
    const fake3 = Math.max(0, count + (Math.floor(Math.random() * 5) - 2))
    const optSet = new Set([count, fake1, fake2, fake3])
    const optList = Array.from(optSet)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)

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
      setFeedback("✅ Correct!")
    } else {
      setFeedback(`❌ Wrong! It was ${correctAnswer}`)
    }
    setTimeout(startNewRound, 1500)
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
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
      {/* Back Button at top-30 left-50 */}
      <div className="fixed top-30 left-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 border border-yellow text-black"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="w-full max-w-2xl rounded-3xl bg-black/45 backdrop-blur p-6 shadow-2xl text-white text-center">
        <h1 className="text-4xl font-bold mb-2 text-[#FF6C00]">🔢 Color Count Quiz</h1>
        <p className="text-lg text-green-300">Score: {score}</p>

        <p className="mt-4 text-xl">
          {showDots
            ? `Memorize the count of ${targetColor.toUpperCase()} dots!`
            : `How many ${targetColor.toUpperCase()} dots did you see?`}
        </p>

        <div className="relative w-full h-[400px] mt-4 rounded border-2 border-white/70 overflow-hidden bg-black/40 backdrop-blur-sm">
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
          <div className="grid grid-cols-2 gap-4 mt-6">
            {options.map((num, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(num)}
                className="px-6 py-3 bg-white text-black rounded text-xl hover:bg-gray-200 font-semibold transition"
                aria-label={`answer ${num}`}
              >
                {num}
              </button>
            ))}
          </div>
        )}

        {!showDots && feedback && (
          <p className="mt-4 text-xl text-yellow-300" aria-live="polite">
            {feedback}
          </p>
        )}
      </section>
    </main>
  )
}
