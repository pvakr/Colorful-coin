"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ColorStopper() {
  const router = useRouter()
  const [running, setRunning] = useState(true)
  const [pos, setPos] = useState(0) // 0..100 (for rendering)
  const posRef = useRef(0) // live numeric tracker for logic (avoids stale closures)
  const [target, setTarget] = useState({ start: 55, end: 70 })
  const [score, setScore] = useState(0)
  const req = useRef<number | null>(null)

  // animation loop
  useEffect(() => {
    const speed = 0.10 // percent per ms
    let last = performance.now()

    const loop = (t: number) => {
      if (!running) {
        // stop scheduling more frames
        req.current = null
        return
      }

      const dt = t - last
      last = t

      // update using functional set to avoid stale state
      setPos((p) => {
        const next = (p + dt * speed) % 100
        posRef.current = next
        return next
      })

      req.current = requestAnimationFrame(loop)
    }

    // start loop
    req.current = requestAnimationFrame(loop)

    return () => {
      // cleanup when effect re-runs or component unmounts
      if (req.current !== null) {
        cancelAnimationFrame(req.current)
        req.current = null
      }
    }
  }, [running]) // restart effect when running toggles

  // Stop action uses posRef.current which is always latest
  const stop = () => {
    // pause animation and cancel any scheduled frame
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
      // inside target zone -> score based on closeness to center
      // clamp to 0..100 and ensure at least 1 point
      const raw = Math.round(100 - (dist / Math.max(halfWidth, 1)) * 100)
      gained = Math.max(1, Math.min(100, raw))
    } else {
      // missed -> penalty
      gained = -20
    }

    setScore((s) => s + gained)
  }

  // Next: set new zone, reset pos, and resume animation
  const next = () => {
    // create a new target size that gets smaller as score increases
    const w = Math.max(6, Math.round(20 - score * 0.2))
    const start = Math.floor(Math.random() * (100 - w))
    setTarget({ start, end: start + w })

    // reset position and resume
    posRef.current = 0
    setPos(0)

    // ensure any leftover raf is cancelled before restarting
    if (req.current !== null) {
      cancelAnimationFrame(req.current)
      req.current = null
    }

    // small timeout to ensure state applied, then start
    // (not strictly required but avoids race conditions on some browsers)
    setTimeout(() => setRunning(true), 0)
  }

  const handleBack = () => {
    router.push("/games")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white relative">
      {/* Fixed Back button */}
      <div className="fixed top-4 left-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-[#FF6C00] drop-shadow-md">
          🎯 Color Stopper
        </h1>
        <p className="text-red-900 font-bold text-lg mb-6">Score: {score}</p>

        {/* Progress bar area */}
        <div className="h-10 rounded-xl border overflow-hidden relative bg-white/70 shadow-md">
          {/* Target zone */}
          <div
            className="absolute inset-y-0 pointer-events-none"
            style={{
              left: `${target.start}%`,
              width: `${target.end - target.start}%`,
              background: "rgba(34,197,94,0.4)",
            }}
          />
          {/* Moving bar (fills from left to pos%) */}
          <div
            className="h-full transition-all"
            style={{
              width: `${pos}%`,
              background:
                "linear-gradient(90deg, rgba(59,130,246,0.6), rgba(99,102,241,0.6))",
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <Button
            onClick={stop}
            className="bg-white/90 text-black hover:bg-gray-100 border border-gray-300"
          >
            Stop
          </Button>
          {!running && (
            <Button
              onClick={next}
              className="bg-white/90 text-black hover:bg-gray-100 border border-gray-300"
            >
              Next
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
