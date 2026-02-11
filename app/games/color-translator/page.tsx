"use client"

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, MessageCircleQuestion } from 'lucide-react'
import GameWrapper from "@/components/GameWrapper"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

type HSL = [number, number, number]
type Cue = { name: string; hsl: HSL }

const COLOR_CUES: Cue[] = [
    { name: "Terracotta", hsl: [24, 52, 59] },
    { name: "Deep Burgundy", hsl: [329, 87, 28] },
    { name: "Olive Drab", hsl: [60, 100, 25] },
    { name: "Silver Fog", hsl: [210, 5, 63] },
    { name: "Copper Rust", hsl: [12, 51, 52] },
    { name: "Dusty Rose", hsl: [330, 24, 69] },
    { name: "Sea Foam Green", hsl: [150, 48, 75] },
    { name: "Marigold Yellow", hsl: [40, 100, 50] },
    { name: "Midnight Blue", hsl: [240, 67, 18] },
    { name: "Charcoal Gray", hsl: [0, 0, 20] },
]

function hslToStr([h, s, l]: HSL): string {
    return `hsl(${h}, ${s}%, ${l}%)`
}

export default function ColorTranslator() {
    const [targetColor, setTargetColor] = useState<HSL>(COLOR_CUES[0].hsl)
    const [correctCue, setCorrectCue] = useState<string>(COLOR_CUES[0].name)
    const [options, setOptions] = useState<string[]>([])
    const [score, setScore] = useState<number>(0)
    const [feedback, setFeedback] = useState<string>("")
    const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false)
    const [isCorrect, setIsCorrect] = useState<boolean>(true)

    const generateRound = () => {
        const targetIndex = Math.floor(Math.random() * COLOR_CUES.length)
        const target = COLOR_CUES[targetIndex]

        setTargetColor(target.hsl)
        setCorrectCue(target.name)

        const allCues = COLOR_CUES.map(c => c.name)
        let distractorCues = allCues
            .filter(name => name !== target.name)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)

        if (distractorCues.length < 3) {
            distractorCues = distractorCues.concat(allCues.slice(0, 3 - distractorCues.length))
        }

        const allOptions = [...distractorCues, target.name].sort(() => Math.random() - 0.5)
        setOptions(allOptions)
        setFeedback("")
    }

    useEffect(() => {
        generateRound()
    }, [])

    const handleClick = (selectedCue: string) => {
        const wasCorrect = selectedCue === correctCue
        setIsCorrect(wasCorrect)

        if (wasCorrect) {
            setScore((s) => s + 1)
            setFeedback("Correct! You nailed the description.")
        } else {
            setFeedback(`Game Over! The correct cue was '${correctCue}'. Your final score is ${score}.`)
        }
        setIsFeedbackOpen(true)
    }

    const handleNextOrRestart = () => {
        setIsFeedbackOpen(false)
        if (isCorrect) {
            generateRound()
        } else {
            setScore(0)
            generateRound()
        }
    }

    return (
        <GameWrapper
            title="Color Translator"
            description="Which word best describes this color?"
            stats={[
                { label: "Score", value: score, icon: null },
            ]}
        >
            <div className="w-full max-w-2xl">
                <motion.div
                    className="flex items-center justify-center mb-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl shadow-2xl border-4 border-white/30 transition-all duration-500 relative overflow-hidden"
                        style={{ backgroundColor: hslToStr(targetColor) }}
                        animate={{ rotate: [0, 2, 0, -2, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-50">
                            <MessageCircleQuestion className="w-12 h-12 text-white/70" />
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="grid grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {options.map((cue, idx) => (
                        <motion.button
                            key={idx}
                            onClick={() => handleClick(cue)}
                            className="w-full py-4 text-lg sm:text-xl rounded-xl tracking-wider uppercase transition-all duration-200 hover:shadow-xl hover:scale-[1.03] focus:ring-4 focus:ring-white/30 bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {cue}
                        </motion.button>
                    ))}
                </motion.div>

                <AnimatePresence>
                    {isFeedbackOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {isCorrect ? (
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-rose-500" />
                                    )}
                                    <h3 className="text-xl font-bold">
                                        {isCorrect ? "Correct Answer!" : "Game Over"}
                                    </h3>
                                </div>
                                <p className="text-gray-600 mb-6">{feedback}</p>
                                <Button onClick={handleNextOrRestart} className="w-full">
                                    {isCorrect ? "Next Color" : "Restart Game"}
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GameWrapper>
    )
}
