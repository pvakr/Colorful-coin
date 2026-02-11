"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ColorThief from 'colorthief'
import ToolWrapper from "@/components/ToolWrapper"
import { Upload, Image as ImageIcon, Sparkles, Palette, Copy, Check } from "lucide-react"

type RGB = [number, number, number]

interface ColorSwatch {
  hex: string
  rgb: RGB
  percentage: number
}

interface HarmonyResult {
  scheme: 'Monochromatic' | 'Complementary' | 'Triadic' | 'Analogous' | 'Achromatic' | 'Other'
  score: number
  notes: string
}

const rgbToHsl = ([r, g, b]: RGB): [number, number, number] => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  } else {
    s = 0
  }

  return [Math.round(h * 360), s, l]
}

const rgbToHex = (rgb: RGB): string => {
  return '#' + rgb.map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export default function ColorHarmonyAnalyzer() {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [colors, setColors] = useState<ColorSwatch[]>([])
  const [analysis, setAnalysis] = useState<HarmonyResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const performAnalysis = useCallback((palette: ColorSwatch[]): HarmonyResult => {
    if (palette.length < 3) {
      return { scheme: 'Other', score: 40, notes: "Need at least 3 distinct colors for proper analysis." }
    }

    const hslPalette = palette.map(c => rgbToHsl(c.rgb))
    const hues = hslPalette.map(h => h[0])
    const avgSaturation = hslPalette.reduce((sum, h) => sum + h[1], 0) / hslPalette.length

    if (avgSaturation < 0.1) {
      return { scheme: 'Achromatic', score: 95, notes: "A beautiful achromatic palette. Excellent for focus and timeless design." }
    }

    const hueRange = Math.max(...hues) - Math.min(...hues)
    if (hueRange <= 20) {
      return { scheme: 'Monochromatic', score: 85, notes: `A unified monochromatic scheme with ${hueRange}° hue range. Conveys calm and harmony.` }
    }

    let maxAngleDiff = 0
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const diff = Math.abs(hues[i] - hues[j])
        const angleDiff = Math.min(diff, 360 - diff)
        maxAngleDiff = Math.max(maxAngleDiff, angleDiff)
      }
    }

    if (maxAngleDiff > 160 && maxAngleDiff < 200) {
      return { scheme: 'Complementary', score: 90, notes: "Strong complementary contrast detected. Creates visual impact and energy!" }
    }

    return { scheme: 'Other', score: 70, notes: "A complex palette with multiple hues. Focus on value contrast for clarity." }
  }, [])

  const extractAndAnalyze = useCallback(async (img: HTMLImageElement) => {
    setIsLoading(true)
    const colorThief = new ColorThief()
    const rawPalette = colorThief.getPalette(img, 5)

    const newColors: ColorSwatch[] = rawPalette.map(rgb => ({
      rgb: rgb as RGB,
      hex: rgbToHex(rgb as RGB),
      percentage: 100 / rawPalette.length,
    }))

    setColors(newColors)
    const result = performAnalysis(newColors)
    setAnalysis(result)
    setIsLoading(false)
  }, [performAnalysis])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string)
        setColors([])
        setAnalysis(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  useEffect(() => {
    const currentImage = imageRef.current
    if (currentImage && imageUrl) {
      if (currentImage.complete) {
        extractAndAnalyze(currentImage)
      } else {
        currentImage.onload = () => extractAndAnalyze(currentImage)
        return () => { currentImage.onload = null }
      }
    }
  }, [imageUrl, extractAndAnalyze])

  const copyToClipboard = async (hex: string, index: number) => {
    await navigator.clipboard.writeText(hex)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <ToolWrapper
      title="Color Harmony Analyzer"
      description="Upload an image to extract colors and evaluate palette harmony"
      icon={<Palette className="h-6 w-6 text-white" />}
    >
      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Image Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Upload Image</label>
              <label className="flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <Upload className="w-10 h-10 text-white/40 mb-2" />
                <span className="text-sm text-white/60">Click to upload image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Image Preview</label>
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/20 bg-white/5">
                {imageUrl ? (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Uploaded"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/40">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-sm">No image uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Analysis Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 rounded-2xl bg-white/5"
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="h-12 w-12 text-amber-400" />
                  </motion.div>
                  <p className="mt-4 text-white/60">Analyzing colors...</p>
                </motion.div>
              ) : analysis ? (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Harmony Score Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-white/20">
                    <div className="grid sm:grid-cols-2 gap-6 items-center">
                      <div>
                        <p className="text-sm text-white/60 uppercase tracking-wider">Color Scheme</p>
                        <p className="text-2xl font-bold text-white">{analysis.scheme}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/60 uppercase tracking-wider">Harmony Score</p>
                        <p className="text-4xl font-bold text-amber-400">{analysis.score}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Expert Notes */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-white/80">{analysis.notes}</p>
                  </div>

                  {/* Extracted Palette */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-white/80">Extracted Palette</label>
                    <div className="flex flex-wrap gap-4">
                      {colors.length > 0 ? (
                        colors.map((c, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex flex-col items-center group cursor-pointer"
                            onClick={() => copyToClipboard(c.hex, i)}
                          >
                            <div
                              style={{ backgroundColor: c.hex }}
                              className="w-16 h-16 rounded-xl shadow-lg border-2 border-white/20 group-hover:scale-110 transition-transform"
                            />
                            <p className="mt-2 text-xs font-mono text-white/60 uppercase">
                              {copiedIndex === i ? (
                                <span className="flex items-center gap-1 text-green-400"><Check className="w-3 h-3" /> Copied</span>
                              ) : (
                                c.hex.toUpperCase()
                              )}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-white/40 text-sm">Upload an image to see extracted colors</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 rounded-2xl bg-white/5 text-white/40"
                >
                  <Palette className="w-16 h-16 mb-4" />
                  <p>Upload an image to analyze color harmony</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </ToolWrapper>
  )
}
