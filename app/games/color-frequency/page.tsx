"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GameWrapper from "@/components/GameWrapper"
import { motion, AnimatePresence } from "framer-motion"

const colorSet = ["#FF6C00", "#00FFB3", "#FF003C", "#7D4AFF", "#00E4FF", "#FFEA00", "#00FF66", "#FF66CC"]

export default function ColorFrequency() {
    const router = useRouter()
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
        setSequence(newSeq)
        setIsShowing(true)
        setInput([])
        const timer = setTimeout(() => setIsShowing(false), 1500 + level * 400)
        return () => clearTimeout(timer)
    }, [level])

    useEffect(() => {
        if (isShowing) {
            setTimeLeft(null)
            return
        }
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

    return (
        <GameWrapper
            title="Color Frequency"
            description="Memorize and repeat the color sequence!"
            stats={[
                { label: "Level", value: level, icon: null },
                { label: "Score", value: score, icon: null },
                { label: "Time", value: timeLeft !== null ? `${timeLeft}s` : "-", icon: <Timer className="w-4 h-4" /> },
            ]}
        >
            <div className="w-full max-w-2xl">
                <AnimatePresence mode="wait">
                    {isShowing ? (
                        <motion.div
                            key="sequence"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex justify-center gap-4 flex-wrap"
                        >
                            {sequence.map((color, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="w-16 h-16 rounded-xl border-2 border-white/30 shadow-lg"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="grid grid-cols-4 gap-4 place-items-center">
                                {colorSet.map((color) => (
                                    <motion.button
                                        key={color}
                                        onClick={() => handleClick(color)}
                                        className="w-16 h-16 rounded-xl border-2 border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                        style={{ backgroundColor: color }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                    <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                {feedback === "Correct!" ? (
                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-rose-500" />
                                )}
                                {feedback}
                            </DialogTitle>
                            <DialogDescription>
                                {feedback === "Correct!" ? `+${level} score` : "Try again next round"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => router.push("/games")}>
                                Back to Games
                            </Button>
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
            </div>
        </GameWrapper>
    )
}
