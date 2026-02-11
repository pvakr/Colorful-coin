"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Timer } from "lucide-react"
import GameWrapper from "@/components/GameWrapper"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

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
    const { toast } = useToast()

    const [score, setScore] = useState(0)
    const [ruleIndex, setRuleIndex] = useState(0)
    const [message, setMessage] = useState("")
    const [roundActive, setRoundActive] = useState(false)
    const [roundKey, setRoundKey] = useState(0)
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME / 1000)

    const startRound = () => {
        setRuleIndex(Math.floor(Math.random() * RULES.length))
        setMessage("")
        setRoundActive(true)
        setRoundKey((k) => k + 1)
        setTimeLeft(ROUND_TIME / 1000)
    }

    useEffect(() => {
        startRound()
    }, [])

    useEffect(() => {
        if (!roundActive) return
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setMessage("Time's up!")
                    toast({ title: "Time's up", description: "Be faster next round." })
                    setRoundActive(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [roundKey, roundActive])

    useEffect(() => {
        if (!roundActive) return
        const timeout = setTimeout(() => {
            setMessage("Time's up!")
            toast({ title: "Time's up", description: "Be faster next round." })
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

    return (
        <GameWrapper
            title="Color Command"
            description="Follow the rules and tap quickly!"
            stats={[
                { label: "Score", value: score, icon: <CheckCircle className="w-4 h-4" /> },
                { label: "Time", value: `${timeLeft}s`, icon: <Timer className="w-4 h-4" /> },
            ]}
        >
            <div className="w-full max-w-lg">
                <motion.div
                    className="mb-8 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="text-xl font-semibold text-center">
                        {roundActive ? RULES[ruleIndex].text(score) : message || "Get ready..."}
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-2 gap-4 place-items-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {COLORS.map((color, idx) => (
                        <motion.button
                            key={color}
                            onClick={() => handleClick(color)}
                            disabled={!roundActive}
                            className={`w-28 h-28 ${getBg(color)} rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed`}
                            aria-label={color}
                            whileHover={{ scale: roundActive ? 1.08 : 1 }}
                            whileTap={{ scale: roundActive ? 0.95 : 1 }}
                        />
                    ))}
                </motion.div>

                <motion.div
                    className="mt-8 flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {!roundActive && (
                        <Button onClick={startRound} className="bg-white/20 backdrop-blur hover:bg-white/30 text-lg px-8">
                            {message ? "Next Round" : "Start Game"}
                        </Button>
                    )}
                </motion.div>

                <AnimatePresence>
                    {message && message !== "Time's up!" && (
                        <Dialog open={!roundActive && !!message && message !== "Time's up!"}>
                            <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-2xl">
                                        {message === "Correct!" ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-rose-500" />
                                        )}
                                        {message}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {message === "Correct!" ? "+1 score" : "Try again next round"}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                    <Button onClick={startRound}>Next Round</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </AnimatePresence>
            </div>
        </GameWrapper>
    )
}
