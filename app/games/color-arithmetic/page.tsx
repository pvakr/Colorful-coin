"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import GameWrapper from "@/components/GameWrapper"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Trophy, Calculator } from "lucide-react"

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
    router.push("/games")
  }

  return (
    <GameWrapper
      title="Color Arithmetic"
      description="What color do you get when you blend these two?"
      stats={[
        { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl sm:text-2xl font-semibold text-center mb-6">What does this blend into?</p>

          {/* Problem row */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white/30 shadow-lg"
              style={{ backgroundColor: rgbToStr(leftColor) }}
            />
            <span className="text-2xl sm:text-3xl font-bold">+</span>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white/30 shadow-lg"
              style={{ backgroundColor: rgbToStr(rightColor) }}
            />
            <span className="text-2xl sm:text-3xl font-bold">=</span>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white/20 border-dashed bg-white/5" />
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClick(opt)}
                aria-label={`option ${idx + 1}`}
                className="aspect-square w-full rounded-xl border-2 border-white/20 shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: rgbToStr(opt) }}
              />
            ))}
          </div>
        </motion.div>

        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                {feedback === "Correct!" ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    Wrong!
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {feedback === "Correct!"
                  ? "Nice! That's the right blend."
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
      </div>
    </GameWrapper>
  )
}
