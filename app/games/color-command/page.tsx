"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const COLORS = ["red", "blue", "green", "yellow"]
const ROUND_TIME = 5000

const RULES = [
  {
    text: (score: number) => `Tap RED if score is even`,
    validate: (color: string, score: number) =>
      (score % 2 === 0 && color === "red") || (score % 2 !== 0 && color !== "red"),
  },
  {
    text: (score: number) => `Tap BLUE if score is odd`,
    validate: (color: string, score: number) =>
      (score % 2 !== 0 && color === "blue") || (score % 2 === 0 && color !== "blue"),
  },
  {
    text: (score: number) => `Tap GREEN if score is a multiple of 3`,
    validate: (color: string, score: number) =>
      (score % 3 === 0 && color === "green") || (score % 3 !== 0 && color !== "green"),
  },
  {
    text: (score: number) => `Tap YELLOW if score ends in 5`,
    validate: (color: string, score: number) =>
      (score % 10 === 5 && color === "yellow") || (score % 10 !== 5 && color !== "yellow"),
  },
]

export default function ColorCommand() {
  const router = useRouter() // ✅ router defined here

  const [score, setScore] = useState(0)
  const [ruleIndex, setRuleIndex] = useState(0)
  const [message, setMessage] = useState("")
  const [roundActive, setRoundActive] = useState(false)
  const [roundKey, setRoundKey] = useState(0)

  const startRound = () => {
    setRuleIndex(Math.floor(Math.random() * RULES.length))
    setMessage("")
    setRoundActive(true)
    setRoundKey((k) => k + 1)
  }

  useEffect(() => {
    startRound()
  }, [])

  useEffect(() => {
    if (!roundActive) return
    const timeout = setTimeout(() => {
      setMessage("⏰ Time’s up!")
      setRoundActive(false)
    }, ROUND_TIME)
    return () => clearTimeout(timeout)
  }, [roundKey, roundActive])

  const handleClick = (color: string) => {
    if (!roundActive) return
    const rule = RULES[ruleIndex]
    const valid = rule.validate(color, score)

    if (valid) {
      setScore((s) => s + 1)
      setMessage("✅ Correct!")
    } else {
      setMessage("❌ Wrong!")
    }

    setRoundActive(false)
  }

  const getBg = (color: string) =>
    ({
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-400",
    }[color])

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to games
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

      <div className="w-full max-w-2xl rounded-3xl bg-black/45 backdrop-blur p-6 shadow-2xl text-white text-center">
        <h1 className="text-4xl font-bold mb-4 text-[#FF6C00] drop-shadow">🧠 Color Command</h1>
        <p className="mb-2 text-lg text-green-300">Score: {score}</p>

        <div className="text-xl mb-4 text-[#00FFB3]">
          {roundActive ? <p className="animate-pulse">{RULES[ruleIndex].text(score)}</p> : <p>{message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 my-4 place-items-center">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleClick(color)}
              disabled={!roundActive}
              className={`w-24 h-24 ${getBg(color)} rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-60`}
              aria-label={color}
            />
          ))}
        </div>

        {!roundActive && (
          <button
            onClick={startRound}
            className="mt-4 px-4 py-2 rounded font-semibold bg-white text-black hover:bg-gray-200 shadow"
          >
            ▶️ Next Round
          </button>
        )}
      </div>
    </main>
  )
}
