"use client"

import { useMemo, useRef, useState, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"

// ---- Reusable Back Button (inline) ----
function BackButton({
  label = "Back to Tools",
  hrefFallback = "/tools",
  className = "",
}: { label?: string; hrefFallback?: string; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const goBack = useCallback(() => {
    if (typeof window === "undefined") return router.push(hrefFallback)

    const ref = document.referrer
    const hasHistory = window.history.length > 1

    const sameOrigin = !!ref && (() => {
      try { return new URL(ref).origin === window.location.origin } catch { return false }
    })()

    const notSelf = !!ref && (() => {
      try { return new URL(ref).pathname !== pathname } catch { return true }
    })()

    if (hasHistory && sameOrigin && notSelf) {
      router.back()
    } else {
      router.push(hrefFallback)
    }
  }, [router, hrefFallback, pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); goBack() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goBack])

  return (
    <motion.button
      onClick={goBack}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-slate-800 ring-1 ring-black/5 shadow hover:bg-white ${className}`}
      aria-label="Go back"
    >
      <span className="text-lg">←</span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  )
}

export default function GradientMaker() {
  const [type, setType] = useState<"linear" | "radial">("linear")
  const [angle, setAngle] = useState(90)
  const [stops, setStops] = useState<string[]>(["#ff6b6b", "#4ecdc4"])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const css = useMemo(() => {
    const list = stops.join(", ")
    return type === "linear" ? `linear-gradient(${angle}deg, ${list})` : `radial-gradient(circle, ${list})`
  }, [type, angle, stops])

  function updateStop(i: number, value: string) {
    setStops((s) => s.map((v, idx) => (idx === i ? value : v)))
  }

  function addStop() {
    setStops((s) => [...s, "#96ceb4"])
  }

  function removeStop(i: number) {
    setStops((s) => (s.length > 2 ? s.filter((_, idx) => idx !== i) : s))
  }

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const w = (canvas.width = 1024)
    const h = (canvas.height = 512)

    if (type === "linear") {
      const rad = (angle * Math.PI) / 180
      const x = Math.cos(rad)
      const y = Math.sin(rad)
      const cx = w / 2
      const cy = h / 2
      const len = Math.max(w, h)
      const grad = ctx.createLinearGradient(cx - x * len, cy - y * len, cx + x * len, cy + y * len)
      stops.forEach((s, i) => grad.addColorStop(i / (stops.length - 1), s))
      ctx.fillStyle = grad
    } else {
      const grad = ctx.createRadialGradient(512, 256, 0, 512, 256, 512)
      stops.forEach((s, i) => grad.addColorStop(i / (stops.length - 1), s))
      ctx.fillStyle = grad
    }

    ctx.fillRect(0, 0, w, h)
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = "gradient.png"
    a.click()
  }

  return (
    <div>
      <main className="min-h-screen p-6">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
          {/* Back navigation */}
          <div className="mb-4">
            <BackButton hrefFallback="/tools" label="Back to Tools" />
          </div>

          <h1 className="text-xl font-bold mb-3">Gradient Maker</h1>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <label className="text-sm font-medium">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="rounded-lg border p-2 bg-white/70"
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>

              {type === "linear" && (
                <div>
                  <label className="block text-sm font-medium">Angle: {angle}°</label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => setAngle(+e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Color Stops</div>
                {stops.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="color" value={s} onChange={(e) => updateStop(i, e.target.value)} />
                    <input
                      value={s}
                      onChange={(e) => updateStop(i, e.target.value)}
                      className="flex-1 rounded-lg border p-2 bg-white/70"
                    />
                    <button onClick={() => removeStop(i)} className="text-sm underline opacity-70">
                      Remove
                    </button>
                  </div>
                ))}
                <button onClick={addStop} className="text-sm underline">
                  Add Stop
                </button>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">CSS</div>
                <pre className="rounded-xl border bg-white/70 p-3 text-xs overflow-x-auto">background: {css};</pre>
              </div>

              <button onClick={downloadPng} className="text-sm underline">
                Export as PNG
              </button>
            </div>

            <div>
              <div className="h-48 rounded-xl border" style={{ background: css }} />
              <canvas ref={canvasRef} className="mt-3 w-full h-0" aria-hidden />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
