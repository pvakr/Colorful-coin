"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ToolWrapper from "@/components/ToolWrapper"
import { Eye, Plus, Trash2, Copy, Check } from "lucide-react"

interface ColorSwatch {
  id: number
  hex: string
}

const getComplementaryHex = (hex: string): string => {
  const r = parseInt(hex.substring(1, 3), 16)
  const g = parseInt(hex.substring(3, 5), 16)
  const b = parseInt(hex.substring(5, 7), 16)
  const rComp = 255 - r
  const gComp = 255 - g
  const bComp = 255 - b
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(rComp)}${toHex(gComp)}${toHex(bComp)}`.toUpperCase()
}

const INITIAL_BACKGROUNDS: ColorSwatch[] = [
  { id: 1, hex: '#FFFFFF' },
  { id: 2, hex: '#000000' },
  { id: 3, hex: '#808080' },
  { id: 4, hex: '#2C3E50' },
  { id: 5, hex: '#F0E68C' },
  { id: 6, hex: '#FF6B6B' },
]

export default function ColorRelativityTester() {
  const router = useRouter()
  const [targetHex, setTargetHex] = useState('#22A7F0')
  const [backgrounds, setBackgrounds] = useState<ColorSwatch[]>(INITIAL_BACKGROUNDS)
  const [nextId, setNextId] = useState(INITIAL_BACKGROUNDS.length + 1)
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const complementaryHex = useMemo(() => getComplementaryHex(targetHex), [targetHex])

  const addBackground = useCallback((hex: string) => {
    setBackgrounds(s => [...s, { id: nextId, hex: hex.toUpperCase() }])
    setNextId(n => n + 1)
  }, [nextId])

  const updateBackground = useCallback((id: number, hex: string) => {
    setBackgrounds(s => s.map(c => (c.id === id ? { ...c, hex: hex.toUpperCase() } : c)))
  }, [])

  const removeBackground = useCallback((id: number) => {
    setBackgrounds(s => s.filter(c => c.id !== id))
  }, [])

  const copyToClipboard = async (hex: string) => {
    await navigator.clipboard.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 2000)
  }

  return (
    <ToolWrapper
      title="Color Relativity Tester"
      description="Test how your target color appears on different backgrounds due to simultaneous contrast"
      icon={<Eye className="h-6 w-6 text-white" />}
    >
      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Target Color */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Target Color</label>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={targetHex}
                    onChange={(e) => setTargetHex(e.target.value.toUpperCase())}
                    className="w-16 h-16 rounded-xl cursor-pointer border-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={targetHex}
                      onChange={(e) => setTargetHex(e.target.value.toUpperCase())}
                      maxLength={7}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white font-mono backdrop-blur-md focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                  <motion.button
                    onClick={() => copyToClipboard(targetHex)}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg bg-white/10 p-2 text-white/70 hover:bg-white/20"
                  >
                    {copiedHex === targetHex ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                  </motion.button>
                </div>
                <p className="mt-2 text-xs text-white/50">This central color remains constant—only its perception changes</p>
              </div>
            </div>

            {/* Background Swatches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white/80">Background Swatches</label>
                <span className="text-xs text-white/50">{backgrounds.length} colors</span>
              </div>
              
              <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
                {/* Quick Add */}
                <div className="flex gap-2 pb-3 border-b border-white/10">
                  <motion.button
                    onClick={() => addBackground('#FFFFFF')}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                  >
                    + White
                  </motion.button>
                  <motion.button
                    onClick={() => addBackground(complementaryHex)}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                  >
                    + Complementary
                  </motion.button>
                </div>

                {backgrounds.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => updateBackground(c.id, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={c.hex}
                      onChange={(e) => updateBackground(c.id, e.target.value)}
                      maxLength={7}
                      className="flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-mono text-white backdrop-blur-md"
                    />
                    <motion.button
                      onClick={() => removeBackground(c.id)}
                      whileTap={{ scale: 0.9 }}
                      className="text-white/50 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                ))}

                <motion.button
                  onClick={() => addBackground('#333333')}
                  whileTap={{ scale: 0.95 }}
                  className="w-full mt-3 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add Swatch
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            <label className="block text-sm font-medium text-white/80">Relativity Test Grid</label>
            <div 
              className="grid gap-4 p-4 rounded-2xl border border-white/20 bg-white/5"
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
              }}
            >
              {backgrounds.map((bg, i) => (
                <motion.div
                  key={bg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  style={{ backgroundColor: bg.hex }}
                  className="h-44 rounded-xl shadow-xl border border-white/30 flex flex-col items-center justify-center p-3"
                >
                  <div
                    style={{ 
                      backgroundColor: targetHex,
                      width: '40%',
                      height: '40%',
                    }}
                    className="rounded-full shadow-2xl ring-4 ring-white/30 transition-colors duration-300"
                    title={`Target: ${targetHex}`}
                  />
                  <p className="mt-3 text-xs font-mono px-2 py-1 rounded-lg bg-white/70 backdrop-blur-sm text-slate-800">
                    {bg.hex}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </ToolWrapper>
  )
}
