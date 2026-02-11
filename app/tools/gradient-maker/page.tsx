"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ToolWrapper from "@/components/ToolWrapper"
import { Palette, Download, Plus, Trash2, RotateCcw } from "lucide-react"

export default function GradientMaker() {
  const router = useRouter()
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
    <ToolWrapper
      title="Gradient Maker"
      description="Create beautiful gradients with customizable colors and angles"
      icon={<Palette className="h-6 w-6 text-white" />}
    >
      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Gradient Type */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Gradient Type</label>
              <div className="flex gap-3">
                {(["linear", "radial"] as const).map((t) => (
                  <motion.button
                    key={t}
                    onClick={() => setType(t)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 rounded-xl px-4 py-3 font-medium transition-all ${
                      type === t
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Angle Control */}
            {type === "linear" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <label className="block text-sm font-medium text-white/80">
                  Angle: <span className="text-cyan-400">{angle}°</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(+e.target.value)}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/20 accent-cyan-500"
                />
              </motion.div>
            )}

            {/* Color Stops */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Color Stops</label>
              <div className="space-y-2">
                {stops.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3"
                  >
                    <input
                      type="color"
                      value={s}
                      onChange={(e) => updateStop(i, e.target.value)}
                      className="h-10 w-10 rounded-xl cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      value={s}
                      onChange={(e) => updateStop(i, e.target.value)}
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 backdrop-blur-md focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 uppercase"
                    />
                    <motion.button
                      onClick={() => removeStop(i)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={stops.length <= 2}
                      className="rounded-xl bg-red-500/20 p-2.5 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={addStop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-white/70 hover:bg-white/20 hover:text-white transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Stop
              </motion.button>
            </div>

            {/* CSS Output */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">CSS Output</label>
              <pre className="rounded-xl border border-white/20 bg-black/30 p-4 text-sm text-white/80 overflow-x-auto backdrop-blur-md">
                background: {css};
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                onClick={downloadPng}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-medium text-white shadow-lg shadow-cyan-500/25"
              >
                <Download className="h-5 w-5" />
                Export PNG
              </motion.button>
              <motion.button
                onClick={() => { setType("linear"); setAngle(90); setStops(["#ff6b6b", "#4ecdc4"]) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white/70 hover:bg-white/20 hover:text-white transition-all"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </motion.button>
            </div>
          </motion.div>

          {/* Preview Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <label className="block text-sm font-medium text-white/80">Live Preview</label>
            <motion.div
              className="h-64 rounded-2xl border-2 border-white/20 shadow-2xl"
              style={{ background: css }}
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="grid grid-cols-4 gap-3">
              {stops.map((s, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-white/20"
                  style={{ background: s }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hidden Canvas for Export */}
        <canvas ref={canvasRef} className="w-full h-0" aria-hidden />
      </div>
    </ToolWrapper>
  )
}
