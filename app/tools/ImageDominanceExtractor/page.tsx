"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ColorThief from 'colorthief'
import ToolWrapper from "@/components/ToolWrapper"
import { Upload, Image as ImageIcon, PieChart, Copy, Check } from "lucide-react"

type RGB = [number, number, number]

interface ColorSwatch {
  hex: string
  rgb: RGB
  percentage: number
}

const rgbToHex = (rgb: RGB): string => {
  return '#' + rgb.map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

const calculateDominance = (rawPalette: number[][]): ColorSwatch[] => {
  const numColors = rawPalette.length
  const weights = Array.from({ length: numColors }, (_, i) => numColors - i)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  return rawPalette.map((rgb, i) => {
    const weight = weights[i]
    const percentage = (weight / totalWeight) * 100

    return {
      rgb: rgb as RGB,
      hex: rgbToHex(rgb as RGB),
      percentage: parseFloat(percentage.toFixed(1)),
    }
  })
}

export default function ImageDominanceExtractor() {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [colors, setColors] = useState<ColorSwatch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const extractAndAnalyze = useCallback(async (img: HTMLImageElement) => {
    setIsLoading(true)
    const colorThief = new ColorThief()
    const rawPalette = colorThief.getPalette(img, 5)
    const newColors = calculateDominance(rawPalette)
    newColors.sort((a, b) => b.percentage - a.percentage)
    setColors(newColors)
    setIsLoading(false)
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string)
        setColors([])
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
      title="Image Dominance Extractor"
      description="Extract dominant colors from images with percentage breakdown"
      icon={<PieChart className="h-6 w-6 text-white" />}
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

            <div className="aspect-square rounded-2xl overflow-hidden border border-white/20 bg-white/5">
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
                  <ImageIcon className="w-16 h-16 mb-2" />
                  <span className="text-sm">No image uploaded</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Results */}
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
                    <PieChart className="h-12 w-12 text-amber-400" />
                  </motion.div>
                  <p className="mt-4 text-white/60">Extracting colors...</p>
                </motion.div>
              ) : colors.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Dominance Chart */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-white/80">Color Dominance</label>
                    <div className="h-12 rounded-xl overflow-hidden flex shadow-lg">
                      {colors.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ width: 0 }}
                          animate={{ width: `${c.percentage}%` }}
                          transition={{ delay: 0.1 * i, duration: 0.5 }}
                          style={{ backgroundColor: c.hex }}
                          className="h-full"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Color Cards */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-white/80">Extracted Colors</label>
                    <div className="space-y-3">
                      {colors.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div
                            style={{ backgroundColor: c.hex }}
                            className="w-16 h-16 rounded-xl shadow-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-mono font-bold text-white">{c.hex.toUpperCase()}</p>
                              <motion.button
                                onClick={() => copyToClipboard(c.hex, i)}
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 rounded-lg bg-white/10 text-white/50 hover:text-white transition-colors"
                              >
                                {copiedIndex === i ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                              </motion.button>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.percentage}%` }}
                                  transition={{ delay: 0.3, duration: 0.5 }}
                                  style={{ backgroundColor: c.hex }}
                                  className="h-full"
                                />
                              </div>
                              <span className="text-sm text-white/60">{c.percentage}%</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
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
                  <PieChart className="w-16 h-16 mb-4" />
                  <p>Upload an image to extract dominant colors</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </ToolWrapper>
  )
}
