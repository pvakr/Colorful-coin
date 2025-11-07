"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

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
  const { toast } = useToast()

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
      setMessage("Time’s up!")
      toast({ title: "Time’s up", description: "Be faster next round." })
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
      setMessage("Correct!")
      toast({ title: "Correct", description: "+1 score" })
    } else {
      setMessage("Wrong!")
      toast({ title: "Wrong", variant: "destructive" })
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Back button - simplified */}
      <div className="fixed top-6 left-6">
        <Button variant="outline" size="sm" className="bg-transparent hover:bg-transparent border px-3" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="w-full max-w-3xl">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Command</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Score</span>
              <span className="font-semibold">{score}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <Timer className="w-3.5 h-3.5" />
              <span>5s</span>
            </span>
          </div>
        </div>

        <p className="mt-6 text-xl sm:text-2xl font-semibold text-center">
          {roundActive ? RULES[ruleIndex].text(score) : message}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 place-items-center">
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
          <div className="mt-6 flex justify-center">
            <Button onClick={startRound} variant="default" className="bg-white text-black hover:bg-gray-200">
              Next Round
            </Button>
          </div>
        )}

        <Dialog open={!roundActive && !!message && message !== "Time’s up!" && message !== "Time's up!"}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                {message === "Correct!" ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                {message}
              </DialogTitle>
              <DialogDescription>
                {message === "Correct!" ? "+1 score" : "Try again next round"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={startRound}>Next Round</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  )
}
