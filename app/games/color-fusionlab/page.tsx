"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Target, Palette } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import GameWrapper from "@/components/GameWrapper"

/* -------------------- Types -------------------- */
interface RgbColor {
  r: number
  g: number
  b: number
}

/* -------------------- Utils -------------------- */
const randomRgb = (): RgbColor => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
})

const rgbToHex = ({ r, g, b }: RgbColor): string =>
  `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`

const similarityScore = (a: RgbColor, b: RgbColor): number => {
  const max = Math.sqrt(3 * 255 * 255)
  const dist = Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  )
  return Math.max(0, Math.round(100 * (1 - dist / max)))
}

/* -------------------- Constants -------------------- */
const INITIAL_RGB: RgbColor = { r: 128, g: 128, b: 128 }
const PASS_SCORE = 95

/* -------------------- Page -------------------- */
export default function ColorFusionLab() {
  const router = useRouter()

  const [target, setTarget] = useState<RgbColor>(INITIAL_RGB)
  const [player, setPlayer] = useState<RgbColor>(INITIAL_RGB)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [match, setMatch] = useState(0)
  const [showTarget, setShowTarget] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const targetHex = useMemo(() => rgbToHex(target), [target])
  const playerHex = useMemo(() => rgbToHex(player), [player])

  const startRound = useCallback(() => {
    setTarget(randomRgb())
    setPlayer(INITIAL_RGB)
    setMatch(0)
    setShowTarget(false)
    setDialogOpen(false)
    setRound(r => r + 1)
  }, [])

  useEffect(() => {
    startRound()
  }, [startRound])

  const submit = () => {
    const s = similarityScore(target, player)
    setMatch(s)
    setShowTarget(true)
    setDialogOpen(true)

    if (s >= PASS_SCORE) {
      setScore(prev => prev + Math.floor(s / 10))
    }

    setTimeout(() => setShowTarget(false), 5000)
  }

  const stats = [
    { label: "Round", value: round, icon: RotateCcw },
    { label: "Score", value: score, icon: Target },
    { label: "Match", value: `${match}%`, icon: Palette },
  ]

  const sliders = [
    { key: "r" as const, label: "Red", color: "#ef4444" },
    { key: "g" as const, label: "Green", color: "#22c55e" },
    { key: "b" as const, label: "Blue", color: "#3b82f6" },
  ]

  return (
    <GameWrapper
      title="Color Fusion Lab"
      description="Master the art of color mixing"
      stats={stats}
    >
      <div className="w-full max-w-4xl space-y-10">
        {/* Colors */}
        <div className="grid md:grid-cols-2 gap-8 p-6 rounded-2xl bg-white/10 border border-white/20">
          {/* Target */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-white flex gap-2 items-center">
              <Target className="w-5 h-5" />
              Target
              {showTarget && (
                <span className="text-sm font-mono text-white/70">
                  ({target.r},{target.g},{target.b})
                </span>
              )}
            </h2>
            <div
              className="mt-4 w-full max-w-xs h-40 rounded-xl border border-white/20"
              style={{ backgroundColor: targetHex }}
            />
          </div>

          {/* Player */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-white flex gap-2 items-center">
              <Palette className="w-5 h-5" />
              Your Color
            </h2>
            <div
              className="mt-4 w-full max-w-xs h-40 rounded-xl border border-white/20"
              style={{ backgroundColor: playerHex }}
            />
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {sliders.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="w-16 text-white font-semibold flex gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                {label}
              </label>
              <input
                type="range"
                min={0}
                max={255}
                value={player[key]}
                onChange={e =>
                  setPlayer(p => ({ ...p, [key]: Number(e.target.value) }))
                }
                className="flex-1"
              />
              <span className="w-12 text-center text-white font-mono">
                {player[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <Button size="lg" onClick={submit}>
            <Target className="w-5 h-5 mr-2" />
            Check Fusion
          </Button>
        </div>

        {/* Result Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {match >= PASS_SCORE ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <XCircle className="text-red-500" />
                )}
                {match >= PASS_SCORE ? "Perfect Match!" : "Try Again"}
              </DialogTitle>
              <DialogDescription>
                Similarity: <strong>{match}%</strong>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => router.push("/games")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={startRound}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Next Round
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </GameWrapper>
  )
}
