"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Shuffle, Lock, Unlock, Download, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Color {
  hex: string
  hsl: { h: number; s: number; l: number }
  locked: boolean
}

type PaletteType = "complementary" | "analogous" | "triadic" | "monochromatic" | "tetradic"

export default function PaletteGeneratorPage() {
  const { toast } = useToast()
  const [paletteType, setPaletteType] = useState<PaletteType>("complementary")
  const [colors, setColors] = useState<Color[]>([])
  const [activeColor, setActiveColor] = useState<string>("#be123c")
  const [copied, setCopied] = useState<string | null>(null)

  // Convert HSL to Hex
  const hslToHex = useCallback((h: number, s: number, l: number): string => {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }, [])

  // Convert Hex to HSL
  const hexToHsl = useCallback((hex: string): { h: number; s: number; l: number } => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  }, [])

  // Generate palette based on type
  const generatePalette = useCallback(() => {
    const baseHsl = hexToHsl(activeColor)
    const newColors: Color[] = []

    // Always include the base color first
    newColors.push({
      hex: activeColor,
      hsl: baseHsl,
      locked: false,
    })

    switch (paletteType) {
      case "complementary":
        newColors.push(
          {
            hex: hslToHex((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l),
            hsl: { h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l },
            locked: false,
          },
          {
            hex: hslToHex(baseHsl.h, Math.max(20, baseHsl.s - 30), Math.min(90, baseHsl.l + 20)),
            hsl: { h: baseHsl.h, s: Math.max(20, baseHsl.s - 30), l: Math.min(90, baseHsl.l + 20) },
            locked: false,
          },
          {
            hex: hslToHex((baseHsl.h + 180) % 360, Math.max(20, baseHsl.s - 30), Math.max(10, baseHsl.l - 20)),
            hsl: { h: (baseHsl.h + 180) % 360, s: Math.max(20, baseHsl.s - 30), l: Math.max(10, baseHsl.l - 20) },
            locked: false,
          },
          {
            hex: hslToHex(baseHsl.h, Math.min(100, baseHsl.s + 20), Math.max(10, baseHsl.l - 30)),
            hsl: { h: baseHsl.h, s: Math.min(100, baseHsl.s + 20), l: Math.max(10, baseHsl.l - 30) },
            locked: false,
          },
        )
        break

      case "analogous":
        for (let i = 1; i <= 5; i++) {
          const hue = (baseHsl.h + i * 30) % 360
          newColors.push({
            hex: hslToHex(hue, baseHsl.s + (i % 2 === 0 ? -10 : 10), baseHsl.l + (i % 3 === 0 ? -15 : 15)),
            hsl: { h: hue, s: baseHsl.s + (i % 2 === 0 ? -10 : 10), l: baseHsl.l + (i % 3 === 0 ? -15 : 15) },
            locked: false,
          })
        }
        break

      case "triadic":
        newColors.push(
          {
            hex: hslToHex((baseHsl.h + 120) % 360, baseHsl.s, baseHsl.l),
            hsl: { h: (baseHsl.h + 120) % 360, s: baseHsl.s, l: baseHsl.l },
            locked: false,
          },
          {
            hex: hslToHex((baseHsl.h + 240) % 360, baseHsl.s, baseHsl.l),
            hsl: { h: (baseHsl.h + 240) % 360, s: baseHsl.s, l: baseHsl.l },
            locked: false,
          },
          {
            hex: hslToHex(baseHsl.h, Math.max(20, baseHsl.s - 20), Math.min(90, baseHsl.l + 25)),
            hsl: { h: baseHsl.h, s: Math.max(20, baseHsl.s - 20), l: Math.min(90, baseHsl.l + 25) },
            locked: false,
          },
          {
            hex: hslToHex((baseHsl.h + 120) % 360, Math.max(20, baseHsl.s - 20), Math.max(10, baseHsl.l - 25)),
            hsl: { h: (baseHsl.h + 120) % 360, s: Math.max(20, baseHsl.s - 20), l: Math.max(10, baseHsl.l - 25) },
            locked: false,
          },
        )
        break

      case "monochromatic":
        for (let i = 1; i <= 5; i++) {
          const lightness = Math.max(10, Math.min(90, baseHsl.l + (i - 3) * 20))
          const saturation = Math.max(20, Math.min(100, baseHsl.s + (i % 2 === 0 ? -15 : 15)))
          newColors.push({
            hex: hslToHex(baseHsl.h, saturation, lightness),
            hsl: { h: baseHsl.h, s: saturation, l: lightness },
            locked: false,
          })
        }
        break

      case "tetradic":
        newColors.push(
          {
            hex: hslToHex((baseHsl.h + 90) % 360, baseHsl.s, baseHsl.l),
            hsl: { h: (baseHsl.h + 90) % 360, s: baseHsl.s, l: baseHsl.l },
            locked: false,
          },
          {
            hex: hslToHex((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l),
            hsl: { h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l },
            locked: false,
          },
          {
            hex: hslToHex((baseHsl.h + 270) % 360, baseHsl.s, baseHsl.l),
            hsl: { h: (baseHsl.h + 270) % 360, s: baseHsl.s, l: baseHsl.l },
            locked: false,
          },
          {
            hex: hslToHex(baseHsl.h, Math.max(20, baseHsl.s - 30), Math.min(90, baseHsl.l + 30)),
            hsl: { h: baseHsl.h, s: Math.max(20, baseHsl.s - 30), l: Math.min(90, baseHsl.l + 30) },
            locked: false,
          },
        )
        break
    }

    // Keep locked colors from previous palette
    if (colors.length > 0) {
      const lockedColors = colors.filter((color) => color.locked)
      lockedColors.forEach((lockedColor, index) => {
        if (index < newColors.length) {
          newColors[index] = lockedColor
        }
      })
    }

    setColors(newColors)
  }, [activeColor, paletteType, colors, hexToHsl, hslToHex])

  // Shuffle palette (regenerate unlocked colors)
  const shufflePalette = useCallback(() => {
    if (colors.length === 0) {
      generatePalette()
      return
    }

    const newColors = colors.map((color) => {
      if (color.locked) return color

      // Generate random variations
      const baseHsl = color.hsl
      const newHue = (baseHsl.h + Math.random() * 60 - 30 + 360) % 360
      const newSat = Math.max(20, Math.min(100, baseHsl.s + Math.random() * 40 - 20))
      const newLight = Math.max(10, Math.min(90, baseHsl.l + Math.random() * 30 - 15))

      return {
        hex: hslToHex(newHue, newSat, newLight),
        hsl: { h: newHue, s: newSat, l: newLight },
        locked: false,
      }
    })

    setColors(newColors)
  }, [colors, hslToHex])

  // Toggle lock on color
  const toggleLock = useCallback((index: number) => {
    setColors((prev) => prev.map((color, i) => (i === index ? { ...color, locked: !color.locked } : color)))
  }, [])

  // Copy color to clipboard
  const copyColor = useCallback(
    async (hex: string) => {
      try {
        await navigator.clipboard.writeText(hex)
        setCopied(hex)
        setTimeout(() => setCopied(null), 2000)
        toast({
          title: "Color copied!",
          description: `${hex} copied to clipboard`,
        })
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Could not copy color to clipboard",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // Export palette
  const exportPalette = useCallback(() => {
    const paletteData = {
      type: paletteType,
      colors: colors.map((color) => ({
        hex: color.hex,
        hsl: color.hsl,
      })),
      createdAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `palette-${paletteType}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Palette exported!",
      description: "JSON file downloaded successfully",
    })
  }, [colors, paletteType, toast])

  return (
    <main className="min-h-screen p-6">
      <section className="mx-auto max-w-6xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/tools">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tools
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Palette Generator</h1>
              <p className="text-muted-foreground">Generate harmonious color palettes for your artwork</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Palette Display */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Color Palette</span>
                  <div className="flex gap-2">
                    <Button onClick={shufflePalette} variant="outline" size="sm">
                      <Shuffle className="w-4 h-4 mr-2" />
                      Shuffle
                    </Button>
                    <Button onClick={exportPalette} variant="outline" size="sm" disabled={colors.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {colors.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No palette generated yet</p>
                    <Button onClick={generatePalette}>Generate Palette</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {colors.map((color, index) => (
                      <div key={index} className="group">
                        <div
                          className="aspect-square rounded-lg border-2 border-border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg relative overflow-hidden"
                          style={{ backgroundColor: color.hex }}
                          onClick={() => setActiveColor(color.hex)}
                        >
                          {/* Lock/Unlock button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLock(index)
                            }}
                            className="absolute top-2 right-2 p-1 rounded bg-black/20 hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {color.locked ? (
                              <Lock className="w-3 h-3 text-white" />
                            ) : (
                              <Unlock className="w-3 h-3 text-white" />
                            )}
                          </button>

                          {/* Active indicator */}
                          {activeColor === color.hex && (
                            <div className="absolute inset-0 border-4 border-primary rounded-lg" />
                          )}
                        </div>

                        {/* Color info */}
                        <div className="mt-2 text-center">
                          <button
                            onClick={() => copyColor(color.hex)}
                            className="text-xs font-mono hover:text-primary transition-colors flex items-center justify-center gap-1"
                          >
                            {copied === color.hex ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {color.hex}
                          </button>
                          <p className="text-xs text-muted-foreground mt-1">
                            HSL({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Base Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={activeColor}
                      onChange={(e) => setActiveColor(e.target.value)}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={activeColor}
                      onChange={(e) => setActiveColor(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="#be123c"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Palette Type</label>
                  <Select value={paletteType} onValueChange={(value: PaletteType) => setPaletteType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complementary">Complementary</SelectItem>
                      <SelectItem value="analogous">Analogous</SelectItem>
                      <SelectItem value="triadic">Triadic</SelectItem>
                      <SelectItem value="monochromatic">Monochromatic</SelectItem>
                      <SelectItem value="tetradic">Tetradic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={generatePalette} className="w-full">
                  Generate Palette
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Choose a base color and palette type</li>
                  <li>• Click Generate to create harmony</li>
                  <li>• Click colors to set as active brush</li>
                  <li>• Lock colors to keep them when shuffling</li>
                  <li>• Copy hex codes or export as JSON</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
