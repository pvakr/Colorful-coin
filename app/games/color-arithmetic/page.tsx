"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    if (JSON.stringify(opt) === JSON.stringify(correct)) {
      setScore((s) => s + 1)
      setFeedback("✅ Correct!")
    } else {
      setFeedback("❌ Wrong!")
    }

    setTimeout(() => {
      generateRound()
    }, 1500)
  }

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to /games
  }

  return (
    <div>
      {/* Back Button positioned at the top left slightly */}
      <div className="fixed top-30 left-60">
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

      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 p-6">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
          <h1 className="text-4xl font-bold mb-4 text-[#FF6C00]">Color Arithmetic</h1>
          <p className="text-red-900 font-bold text-lg">Score: {score}</p>

          <p className="mt-4 text-xl text-start">What does this blend into?</p>

          <div className="flex space-x-4 mt-4 justify-center">
            <div className="w-20 h-20 rounded" style={{ backgroundColor: rgbToStr(leftColor) }}></div>
            <div className="w-20 h-20 rounded" style={{ backgroundColor: rgbToStr(rightColor) }}></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleClick(opt)}
                className="w-24 h-24 rounded shadow-md border-2 border-white hover:scale-105 transition-transform"
                style={{ backgroundColor: rgbToStr(opt) }}
              />
            ))}
          </div>

          {feedback && <p className="mt-4 text-yellow-300 text-xl">{feedback}</p>}
        </section>
      </main>
    </div>
  )
}
