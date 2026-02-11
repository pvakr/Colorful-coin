"use client"

import { useEffect, useRef, useState } from "react"
import GameWrapper from "@/components/GameWrapper"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function ColorStopper() {
    const [running, setRunning] = useState(true)
    const [pos, setPos] = useState(0)
    const posRef = useRef(0)
    const [target, setTarget] = useState({ start: 55, end: 70 })
    const [score, setScore] = useState(0)
    const req = useRef<number | null>(null)

    useEffect(() => {
        const speed = 0.10
        let last = performance.now()
        const loop = (t: number) => {
            if (!running) {
                req.current = null
                return
            }
            const dt = t - last
            last = t
            setPos((p) => {
                const next = (p + dt * speed) % 100
                posRef.current = next
                return next
            })
            req.current = requestAnimationFrame(loop)
        }
        req.current = requestAnimationFrame(loop)
        return () => {
            if (req.current !== null) {
                cancelAnimationFrame(req.current)
                req.current = null
            }
        }
    }, [running])

    const stop = () => {
        setRunning(false)
        if (req.current !== null) {
            cancelAnimationFrame(req.current)
            req.current = null
        }
        const livePos = posRef.current
        const center = (target.start + target.end) / 2
        const halfWidth = (target.end - target.start) / 2
        const dist = Math.abs(livePos - center)
        let gained = 0
        if (livePos >= target.start && livePos <= target.end) {
            const raw = Math.round(100 - (dist / Math.max(halfWidth, 1)) * 100)
            gained = Math.max(1, Math.min(100, raw))
        } else {
            gained = -20
        }
        setScore((s) => s + gained)
    }

    const next = () => {
        const w = Math.max(6, Math.round(20 - score * 0.2))
        const start = Math.floor(Math.random() * (100 - w))
        setTarget({ start, end: start + w })
        posRef.current = 0
        setPos(0)
        if (req.current !== null) {
            cancelAnimationFrame(req.current)
            req.current = null
        }
        setTimeout(() => setRunning(true), 0)
    }

    const progressPercent = (pos / 100) * 100

    return (
        <GameWrapper
            title="Color Stopper"
            description="Stop the bar in the green zone!"
            stats={[
                { label: "Score", value: score, icon: null },
            ]}
        >
            <div className="w-full max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <div className="h-16 rounded-xl border overflow-hidden relative bg-white/10 backdrop-blur shadow-lg">
                        <motion.div
                            className="absolute inset-y-0 pointer-events-none"
                            style={{
                                left: `${target.start}%`,
                                width: `${target.end - target.start}%`,
                                background: "rgba(34,197,94,0.4)",
                            }}
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                        <motion.div
                            className="h-full transition-all"
                            style={{
                                width: `${pos}%`,
                                background: "linear-gradient(90deg, rgba(59,130,246,0.8), rgba(99,102,241,0.8))",
                            }}
                        />
                    </div>

                    <motion.div
                        className="mt-8 flex gap-4 justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Button
                            onClick={stop}
                            className="bg-white/20 backdrop-blur hover:bg-white/30 text-lg px-8 py-6"
                        >
                            Stop
                        </Button>
                        {!running && (
                            <Button
                                onClick={next}
                                className="bg-white/20 backdrop-blur hover:bg-white/30 text-lg px-8 py-6"
                            >
                                Next
                            </Button>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </GameWrapper>
    )
}
