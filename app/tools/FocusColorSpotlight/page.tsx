"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ToolWrapper from "@/components/ToolWrapper"
import { Upload, Download, Eye, Palette, Sparkles } from "lucide-react"

type RGB = [number, number, number]

const hexToRgb = (hex: string): RGB => {
  if (!/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex)) return [128, 128, 128]
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  const r = parseInt(hex.substring(1, 3), 16)
  const g = parseInt(hex.substring(3, 5), 16)
  const b = parseInt(hex.substring(5, 7), 16)
  return [r, g, b]
}

const rgbToHex = ([r, g, b]: RGB): string => {
  const toHex = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
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

  return [h * 360, s, l]
}

const hslToRgb = ([h, s, l]: [number, number, number]): RGB => {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    h /= 360
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

const colorDistance = (rgb1: RGB, rgb2: RGB): number => {
  const rmean = (rgb1[0] + rgb2[0]) / 2
  const r = rgb1[0] - rgb2[0]
  const g = rgb1[1] - rgb2[1]
  const b = rgb1[2] - rgb2[2]
  return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8))
}

export default function FocusColorSpotlight() {
  const router = useRouter()
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [focusHex, setFocusHex] = useState<string>('#FF0000')
  const [tolerance, setTolerance] = useState<number>(30)
  const [desaturationAmount, setDesaturationAmount] = useState<number>(0.9)
  const [darkenAmount, setDarkenAmount] = useState<number>(0.5)
  const [lightenAmount, setLightenAmount] = useState<number>(0)
  const [hueShiftAmount, setHueShiftAmount] = useState<number>(0)
  const [highlightMode, setHighlightMode] = useState<'spotlight' | 'inverse'>('spotlight')
  const [isPicking, setIsPicking] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const tempImageRef = useRef<HTMLImageElement>(null)

  const applyEffect = useCallback(() => {
    if (!originalImageUrl || !imageCanvasRef.current || !tempImageRef.current) return

    setIsLoading(true)

    const canvas = imageCanvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      setIsLoading(false)
      return
    }

    const img = tempImageRef.current

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const focusRgb = hexToRgb(focusHex)

    for (let i = 0; i < data.length; i += 4) {
      const pixelRgb: RGB = [data[i], data[i + 1], data[i + 2]]
      const isFocusColor = colorDistance(pixelRgb, focusRgb) <= tolerance

      let [h, s, l] = rgbToHsl(pixelRgb)

      if ((highlightMode === 'spotlight' && !isFocusColor) || (highlightMode === 'inverse' && isFocusColor)) {
        s = s * (1 - desaturationAmount)
        l = l * (1 - darkenAmount)
        l = l + (1 - l) * lightenAmount
        h = (h + hueShiftAmount + 360) % 360
      }

      const [r, g, b] = hslToRgb([h, s, l])

      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    ctx.putImageData(imageData, 0, 0)
    setIsLoading(false)
  }, [originalImageUrl, focusHex, tolerance, desaturationAmount, darkenAmount, lightenAmount, hueShiftAmount, highlightMode])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setOriginalImageUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  useEffect(() => {
    if (tempImageRef.current && originalImageUrl) {
      if (tempImageRef.current.complete) {
        applyEffect()
      } else {
        tempImageRef.current.onload = applyEffect
      }
    }
  }, [originalImageUrl, applyEffect])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPicking || !imageCanvasRef.current) return

    const canvas = imageCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const pixel = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data
    const pickedHex = rgbToHex([pixel[0], pixel[1], pixel[2]])
    setFocusHex(pickedHex)
    setIsPicking(false)
  }, [isPicking])

  const handleDownload = useCallback(() => {
    if (!imageCanvasRef.current) return
    const canvas = imageCanvasRef.current
    const link = document.createElement('a')
    link.download = `focus-color-spotlight-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  return (
    <ToolWrapper
      title="Focus Color Spotlight"
      description="Make specific colors pop by desaturating and darkening all other colors"
      icon={<Eye className="h-6 w-6 text-white" />}
    >
      <div className="p-6">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column - Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Upload Image</label>
              <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <Upload className="w-8 h-8 text-white/40 mb-2" />
                <span className="text-sm text-white/60">Click to upload</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            {/* Focus Color */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Focus Color</label>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={focusHex}
                    onChange={(e) => setFocusHex(e.target.value.toUpperCase())}
                    className="w-14 h-14 rounded-xl cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={focusHex}
                    onChange={(e) => setFocusHex(e.target.value.toUpperCase())}
                    maxLength={7}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white font-mono backdrop-blur-md focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <motion.button
                  onClick={() => setIsPicking(!isPicking)}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full mt-3 flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium transition-all ${
                    isPicking ? 'bg-orange-500 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  }`}
                  disabled={!originalImageUrl}
                >
                  <Palette className="h-4 w-4" />
                  {isPicking ? 'Click Image to Pick...' : 'Pick Color from Image'}
                </motion.button>
              </div>
            </div>

            {/* Effect Mode */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">Effect Mode</label>
              <div className="flex gap-2">
                {(['spotlight', 'inverse'] as const).map((mode) => (
                  <motion.button
                    key={mode}
                    onClick={() => setHighlightMode(mode)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                      highlightMode === mode
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {mode === 'spotlight' ? 'Spotlight' : 'Inverse'}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="block text-sm font-medium text-white/80">Effect Intensity</label>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>Tolerance</span>
                    <span>{tolerance}</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={tolerance}
                    onChange={(e) => setTolerance(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full accent-cyan-500 bg-white/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>Desaturation</span>
                    <span>{(desaturationAmount * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05" value={desaturationAmount}
                    onChange={(e) => setDesaturationAmount(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full accent-cyan-500 bg-white/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>Darken</span>
                    <span>{(darkenAmount * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05" value={darkenAmount}
                    onChange={(e) => setDarkenAmount(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full accent-cyan-500 bg-white/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>Hue Shift</span>
                    <span>{hueShiftAmount}°</span>
                  </div>
                  <input
                    type="range" min="-180" max="180" step="5" value={hueShiftAmount}
                    onChange={(e) => setHueShiftAmount(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full accent-cyan-500 bg-white/20"
                  />
                </div>
              </div>

              <motion.button
                onClick={applyEffect}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 font-medium text-white shadow-lg"
                disabled={isLoading || !originalImageUrl}
              >
                <Sparkles className="h-4 w-4" />
                {isLoading ? 'Applying...' : 'Apply Effect'}
              </motion.button>
            </div>
          </motion.div>

          {/* Right Column - Image Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-4"
          >
            <label className="block text-sm font-medium text-white/80">Result</label>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 bg-white/5">
              {originalImageUrl ? (
                <>
                  <img ref={tempImageRef} src={originalImageUrl} alt="Original" className="hidden" crossOrigin="anonymous" />
                  <canvas
                    ref={imageCanvasRef}
                    className={`w-full h-full object-contain ${isPicking ? 'cursor-crosshair ring-4 ring-orange-400' : ''}`}
                    onClick={handleCanvasClick}
                  />
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center"
                      >
                        <Sparkles className="w-12 h-12 text-amber-400 animate-spin" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Eye className="w-16 h-16 mb-4" />
                  <p>Upload an image to start spotlighting colors</p>
                </div>
              )}
            </div>

            {originalImageUrl && (
              <motion.button
                onClick={handleDownload}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-medium text-white shadow-lg"
              >
                <Download className="h-5 w-5" />
                Download Image
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </ToolWrapper>
  )
}
