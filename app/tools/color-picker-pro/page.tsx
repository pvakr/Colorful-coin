"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { hexToRgb, parseRgb, rgbToHex } from "../lib/colors"
import ToolWrapper from "@/components/ToolWrapper"
import { Palette, Copy, Check } from "lucide-react"

export default function ColorPickerPro() {
  const router = useRouter()
  const [hex, setHex] = useState("#4f46e5")
  const [rgb, setRgb] = useState("rgb(79, 70, 229)")
  const [copiedHex, setCopiedHex] = useState(false)
  const [copiedRgb, setCopiedRgb] = useState(false)

  const swatch = useMemo(() => {
    const hexParsed = hexToRgb(hex)
    const rgbParsed = parseRgb(rgb)
    if (hexParsed) return { hexValid: true, rgbValid: !!rgbParsed, color: hex }
    if (rgbParsed) return { hexValid: !!hexParsed, rgbValid: true, color: rgbToHex(rgbParsed) }
    return { hexValid: false, rgbValid: false, color: "#cccccc" }
  }, [hex, rgb])

  function syncFromHex(v: string) {
    setHex(v)
    const r = hexToRgb(v)
    if (r) setRgb(`rgb(${r.r}, ${r.g}, ${r.b})`)
  }

  function syncFromRgb(v: string) {
    setRgb(v)
    const r = parseRgb(v)
    if (r) setHex(rgbToHex(r))
  }

  const copyToClipboard = useCallback(async (text: string, setCopied: (val: boolean) => void) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <ToolWrapper
      title="Color Picker Pro"
      description="Advanced color picker with real-time conversion between HEX and RGB formats"
      icon={<Palette className="h-6 w-6 text-white" />}
    >
      <div className="p-6">
        {/* Input Section */}
        <div className="grid sm:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-white/80">HEX</label>
            <div className="relative group">
              <input
                value={hex}
                onChange={(e) => syncFromHex(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-md focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              <motion.button
                onClick={() => copyToClipboard(hex, setCopiedHex)}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Copy HEX"
              >
                {copiedHex ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-white/80">RGB</label>
            <div className="relative group">
              <input
                value={rgb}
                onChange={(e) => syncFromRgb(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-md focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              <motion.button
                onClick={() => copyToClipboard(rgb, setCopiedRgb)}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Copy RGB"
              >
                {copiedRgb ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid sm:grid-cols-2 gap-6 items-center"
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/80">Live Preview</label>
            <motion.div
              className="h-40 rounded-2xl border-2 border-white/20 shadow-inner"
              style={{ background: swatch.color as string }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-white/60">Preview Elements:</p>
              <motion.button
                className="px-6 py-3 rounded-xl font-semibold shadow-lg"
                style={{ background: swatch.color as string, color: "white" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sample Button
              </motion.button>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md">
                <span
                  className="text-lg font-medium"
                  style={{ color: swatch.color as string }}
                >
                  Colored Text Example
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Color Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {["R", "G", "B"].map((channel, i) => {
            const value = swatch.color === "#cccccc" ? 0 : (() => {
              const rgb = hexToRgb(hex)
              return rgb ? [rgb.r, rgb.g, rgb.b][i] : 0
            })()
            return (
              <div key={channel} className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-md">
                <p className="text-sm text-white/60">{channel}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            )
          })}
        </motion.div>
      </div>
    </ToolWrapper>
  )
}
