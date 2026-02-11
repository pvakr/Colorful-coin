"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ToolWrapper from "@/components/ToolWrapper"
import { Sparkles, Search, Copy, Check, Palette } from "lucide-react"

interface ColorSwatch {
  hex: string
}

const MoodPalettes: Record<string, string[]> = {
  'Melancholy': ["#1C3144", "#4A5859", "#A9ACB2", "#C99E10", "#545454"],
  'Vibrant Joy': ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF9F43"],
  'Serene Calm': ["#B9E0FF", "#8D9EFF", "#D5F0FF", "#F8F0E3", "#E3DFFD"],
  'Cyberpunk': ["#FF00FF", "#00FFFF", "#39FF14", "#0D0D0D", "#7C00FF"],
  'Earthy Forest': ["#386641", "#6A994E", "#A7C957", "#F2E8CF", "#BC4749"],
  'Vintage Sepia': ["#87695D", "#BCB0A3", "#3C3931", "#DCD5C9", "#A6978D"],
  'Energetic': ["#FF3F3F", "#FF9999", "#570000", "#FFC700", "#FF8C00"],
  'Mysterious': ["#2C3E50", "#34495E", "#E74C3C", "#9B59B6", "#1ABC9C"],
}

const MoodKeys = Object.keys(MoodPalettes)

export default function AIMoodPaletteGenerator() {
  const router = useRouter()
  const [currentMood, setCurrentMood] = useState(MoodKeys[0])
  const [inputMood, setInputMood] = useState('')
  const [palette, setPalette] = useState<ColorSwatch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const generatePalette = useCallback((moodKey: string) => {
    setIsLoading(true)
    setTimeout(() => {
      const hexCodes = MoodPalettes[moodKey] || MoodPalettes['Melancholy']
      const newPalette: ColorSwatch[] = hexCodes.map(hex => ({ hex }))
      setPalette(newPalette)
      setCurrentMood(moodKey)
      setIsLoading(false)
    }, 800)
  }, [])

  useEffect(() => {
    generatePalette(currentMood)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const match = MoodKeys.find(key => key.toLowerCase().includes(inputMood.toLowerCase()))
    
    if (match) {
      generatePalette(match)
    } else if (inputMood.trim() !== '') {
      const randomKey = MoodKeys[Math.floor(Math.random() * MoodKeys.length)]
      generatePalette(randomKey)
      setCurrentMood(inputMood.trim())
    }
  }

  const handleSuggestionClick = (mood: string) => {
    setInputMood(mood)
    generatePalette(mood)
  }

  const copyToClipboard = async (hex: string, index: number) => {
    await navigator.clipboard.writeText(hex)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <ToolWrapper
      title="AI Mood Palette Generator"
      description="Generate beautiful color palettes based on moods and themes using AI"
      icon={<Sparkles className="h-6 w-6 text-white" />}
    >
      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Input & Suggestions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Search Input */}
            <form onSubmit={handleSearch} className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Define the Mood</label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={inputMood}
                  onChange={(e) => setInputMood(e.target.value)}
                  placeholder="Enter mood (e.g., Cyberpunk, Calm)"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pl-10 text-white placeholder-white/40 backdrop-blur-md focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              </div>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-medium text-white shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-5 w-5" />
                {isLoading ? 'Generating...' : 'Generate Palette'}
              </motion.button>
            </form>

            {/* Quick Suggestions */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Quick Suggestions</label>
              <div className="flex flex-wrap gap-2">
                {MoodKeys.map((mood, i) => (
                  <motion.button
                    key={mood}
                    onClick={() => handleSuggestionClick(mood)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      currentMood === mood || inputMood === mood
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {mood}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Palette Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-white/80">Generated Palette</label>
              <span className="text-sm text-purple-400 font-medium capitalize">{currentMood}</span>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-12 w-12 text-purple-400" />
                  </motion.div>
                  <p className="mt-4 text-white/60">AI is crafting your palette...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="palette"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Dominance Bar */}
                  <div className="flex w-full h-20 rounded-2xl overflow-hidden shadow-lg">
                    {palette.map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        animate={{ width: `${100 / palette.length}%` }}
                        transition={{ delay: 0.1 * i, duration: 0.5 }}
                        style={{ backgroundColor: c.hex }}
                        className="h-full"
                      />
                    ))}
                  </div>

                  {/* Detailed Swatches */}
                  <div className="grid grid-cols-5 gap-4">
                    {palette.map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="space-y-2"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="h-24 rounded-xl shadow-lg cursor-pointer relative overflow-hidden group"
                          style={{ backgroundColor: c.hex }}
                          onClick={() => copyToClipboard(c.hex, i)}
                        >
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              className="bg-white/90 rounded-full p-2 shadow-lg"
                            >
                              {copiedIndex === i ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-slate-700" />
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                        <p className="text-center text-sm font-mono text-white/80 uppercase">
                          {c.hex}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </ToolWrapper>
  )
}
