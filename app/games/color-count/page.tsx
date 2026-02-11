"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle } from "lucide-react"
import GameWrapper from "@/components/GameWrapper"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"

const COLORS = ["red", "blue", "green", "yellow", "purple"]
const DOT_COUNT = 30
const DISPLAY_DURATION = 4000

export default function ColorCountQuiz() {
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

    const answerColors = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-fuchsia-500"]

    return (
        <GameWrapper
            title="Color Count Quiz"
            description="Count the colored dots, then guess the number!"
            stats={[
                { label: "Score", value: score, icon: null },
            ]}
        >
            <div className="w-full max-w-2xl">
                <motion.div
                    className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="text-xl font-semibold text-center">
                        {showDots
                            ? `Memorize the count of ${targetColor.toUpperCase()} dots!`
                            : `How many ${targetColor.toUpperCase()} dots did you see?`}
                    </p>
                </motion.div>

                <motion.div
                    className="relative w-full h-[400px] rounded-xl border-2 overflow-hidden bg-white/5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ borderColor: "rgba(255,255,255,0.3)" }}
                >
                    <AnimatePresence mode="wait">
                        {showDots && (
                            <motion.div
                                key="dots"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0"
                            >
                                {dots.map((dot, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className={`absolute w-6 h-6 rounded-full ${getBg(dot.color)} shadow-md`}
                                        style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                                    />
                                ))}
                            </motion.div>
                        )}
                        {!showDots && (
                            <motion.div
                                key="question"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                                    <span className="text-4xl font-bold">{targetColor.toUpperCase()}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <AnimatePresence>
                    {!showDots && (
                        <motion.div
                            className="grid grid-cols-2 gap-4 mt-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {options.map((num, idx) => (
                                <motion.button
                                    key={idx}
                                    onClick={() => handleAnswer(num)}
                                    className={`px-6 py-4 rounded-xl text-white text-2xl font-semibold shadow-md hover:scale-[1.03] active:scale-95 transition-transform ${answerColors[idx % 4]}`}
                                    aria-label={`answer ${num}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {num}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                    <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                {feedback.startsWith("Correct") ? (
                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-rose-500" />
                                )}
                                {feedback}
                            </DialogTitle>
                            <DialogDescription>
                                {feedback.startsWith("Correct") ? "+1 score" : `The correct answer was ${correctAnswer}`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => { setIsFeedbackOpen(false); startNewRound(); }}>
                                Next Round
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </GameWrapper>
    )
}
