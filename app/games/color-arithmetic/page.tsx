"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type RGB = [number, number, number]

const BASE_COLORS: RGB[] = [
  [255, 0, 0], // Red
  [0, 255, 0], // Green
  [0, 0, 255], // Blue
  [255, 255, 0], // Yellow
  [255, 0, 255], // Magenta
  [0, 255, 255], // Cyan
]

function rgbToStr([r, g, b]: RGB) {
  return `rgb(${r}, ${g}, ${b})`
}

function blendColors(c1: RGB, c2: RGB): RGB {
  return [Math.round((c1[0] + c2[0]) / 2), Math.round((c1[1] + c2[1]) / 2), Math.round((c1[2] + c2[2]) / 2)]
}

function randomColor(): RGB {
  return BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]
}

export default function ColorArithmetic() {
  const router = useRouter()
  const [leftColor, setLeftColor] = useState<RGB>([255, 0, 0])
  const [rightColor, setRightColor] = useState<RGB>([0, 0, 255])
  const [correct, setCorrect] = useState<RGB>([127, 0, 127])
  const [options, setOptions] = useState<RGB[]>([])
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const generateRound = () => {
    const left = randomColor()
    let right = randomColor()
    while (right === left) right = randomColor()

    const answer = blendColors(left, right)
    const otherOptions: RGB[] = []

    while (otherOptions.length < 3) {
      const fake = [
        Math.max(0, Math.min(255, answer[0] + Math.floor(Math.random() * 100 - 50))),
        Math.max(0, Math.min(255, answer[1] + Math.floor(Math.random() * 100 - 50))),
        Math.max(0, Math.min(255, answer[2] + Math.floor(Math.random() * 100 - 50))),
      ] as RGB

      if (!otherOptions.some((opt) => JSON.stringify(opt) === JSON.stringify(fake))) {
        otherOptions.push(fake)
      }
    }

    const allOptions = [...otherOptions, answer].sort(() => Math.random() - 0.5)

    setLeftColor(left)
    setRightColor(right)
    setCorrect(answer)
    setOptions(allOptions)
    setFeedback("")
  }

  useEffect(() => {
    generateRound()
  }, [])

  const handleClick = (opt: RGB) => {
    const isCorrect = JSON.stringify(opt) === JSON.stringify(correct)
    if (isCorrect) {
      setScore((s) => s + 1)
      setFeedback("Correct!")
    } else {
      setFeedback("Wrong!")
    }
    setIsFeedbackOpen(true)
  }

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to /games
  }

  return (
    <div>
      {/* Back button - no background colors added */}
      <div className="fixed top-6 left-6">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent hover:bg-transparent border px-3"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <section className="w-full max-w-3xl">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Arithmetic</h1>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Score</span>
              <span className="font-semibold">{score}</span>
            </span>
          </div>

          <p className="mt-6 text-xl sm:text-2xl font-semibold text-center">What does this blend into?</p>

          {/* Problem row */}
          <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
            <div
              aria-label="left color"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-md border"
              style={{ backgroundColor: rgbToStr(leftColor) }}
            />
            <span className="text-2xl sm:text-3xl font-bold">+</span>
            <div
              aria-label="right color"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-md border"
              style={{ backgroundColor: rgbToStr(rightColor) }}
            />
            <span className="text-2xl sm:text-3xl font-bold">=</span>
            <div
              aria-hidden
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-md border border-dashed"
            />
          </div>

          {/* Options grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleClick(opt)}
                aria-label={`option ${idx + 1}`}
                className="group relative aspect-square w-full rounded-md border transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-[1.03]"
                style={{ backgroundColor: rgbToStr(opt) }}
              >
                <span className="sr-only">Choose color option {idx + 1}</span>
              </button>
            ))}
          </div>

          <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  {feedback === "Correct!" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                  {feedback}
                </DialogTitle>
                <DialogDescription>
                  {feedback === "Correct!"
                    ? "Nice! That’s the right blend."
                    : "Not quite. Try the next one!"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setIsFeedbackOpen(false)
                    generateRound()
                  }}
                >
                  Next
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>
      </main>
    </div>
  )
}
