"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, RotateCcw, Download, Grid, FlipHorizontal, FlipVertical, RotateCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SymmetryMode = "none" | "horizontal" | "vertical" | "radial4" | "radial6" | "radial8" | "tiling"

interface DrawPoint {
  x: number
  y: number
  pressure: number
}

export default function SymmetryPainterPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<DrawPoint | null>(null)

  // State
  const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>("none")
  const [brushSize, setBrushSize] = useState([8])
  const [brushColor, setBrushColor] = useState("#be123c")
  const [brushOpacity, setBrushOpacity] = useState([80])

  // Drawing functions
  const drawLine = useCallback(
    (ctx: CanvasRenderingContext2D, from: DrawPoint, to: DrawPoint, color: string, size: number, opacity: number) => {
      ctx.save()
      ctx.globalAlpha = opacity / 100
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.restore()
    },
    [],
  )

  const applySymmetry = useCallback(
    (ctx: CanvasRenderingContext2D, point: DrawPoint, lastPoint: DrawPoint | null) => {
      const canvas = canvasRef.current
      if (!canvas || !lastPoint) return

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const color = brushColor
      const size = brushSize[0]
      const opacity = brushOpacity[0]

      // Always draw the original stroke
      drawLine(ctx, lastPoint, point, color, size, opacity)

      switch (symmetryMode) {
        case "horizontal":
          // Mirror horizontally
          const hMirrorPoint = { ...point, x: canvas.width - point.x }
          const hMirrorLast = { ...lastPoint, x: canvas.width - lastPoint.x }
          drawLine(ctx, hMirrorLast, hMirrorPoint, color, size, opacity)
          break

        case "vertical":
          // Mirror vertically
          const vMirrorPoint = { ...point, y: canvas.height - point.y }
          const vMirrorLast = { ...lastPoint, y: canvas.height - lastPoint.y }
          drawLine(ctx, vMirrorLast, vMirrorPoint, color, size, opacity)
          break

        case "radial4":
        case "radial6":
        case "radial8":
          const segments = symmetryMode === "radial4" ? 4 : symmetryMode === "radial6" ? 6 : 8
          const angleStep = (Math.PI * 2) / segments

          for (let i = 1; i < segments; i++) {
            const angle = angleStep * i
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)

            // Rotate point around center
            const rotatedPoint = {
              x: centerX + (point.x - centerX) * cos - (point.y - centerY) * sin,
              y: centerY + (point.x - centerX) * sin + (point.y - centerY) * cos,
              pressure: point.pressure,
            }

            const rotatedLast = {
              x: centerX + (lastPoint.x - centerX) * cos - (lastPoint.y - centerY) * sin,
              y: centerY + (lastPoint.x - centerX) * sin + (lastPoint.y - centerY) * cos,
              pressure: lastPoint.pressure,
            }

            drawLine(ctx, rotatedLast, rotatedPoint, color, size, opacity)
          }
          break

        case "tiling":
          // Create a 3x3 tiling pattern
          const tileWidth = canvas.width / 3
          const tileHeight = canvas.height / 3

          for (let tileX = 0; tileX < 3; tileX++) {
            for (let tileY = 0; tileY < 3; tileY++) {
              if (tileX === 1 && tileY === 1) continue // Skip center tile (original)

              const offsetX = tileX * tileWidth
              const offsetY = tileY * tileHeight

              // Map point to tile coordinates
              const tilePoint = {
                x: (point.x % tileWidth) + offsetX,
                y: (point.y % tileHeight) + offsetY,
                pressure: point.pressure,
              }

              const tileLast = {
                x: (lastPoint.x % tileWidth) + offsetX,
                y: (lastPoint.y % tileHeight) + offsetY,
                pressure: lastPoint.pressure,
              }

              drawLine(ctx, tileLast, tilePoint, color, size, opacity)
            }
          }
          break
      }
    },
    [symmetryMode, brushColor, brushSize, brushOpacity, drawLine],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      const rect = canvas.getBoundingClientRect()
      const currentPoint: DrawPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: 1,
      }

      if (lastPointRef.current) {
        applySymmetry(ctx, currentPoint, lastPointRef.current)
      }

      lastPointRef.current = currentPoint
    },
    [applySymmetry],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    lastPointRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: 1,
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false
    lastPointRef.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.fillStyle = "#fdf2f8"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const exportPattern = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `symmetry-pattern-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Pattern exported!",
        description: "PNG file downloaded successfully",
      })
    })
  }, [toast])

  const drawGuides = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.save()
    ctx.strokeStyle = "rgba(190, 18, 60, 0.2)"
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    switch (symmetryMode) {
      case "horizontal":
        ctx.beginPath()
        ctx.moveTo(0, centerY)
        ctx.lineTo(canvas.width, centerY)
        ctx.stroke()
        break

      case "vertical":
        ctx.beginPath()
        ctx.moveTo(centerX, 0)
        ctx.lineTo(centerX, canvas.height)
        ctx.stroke()
        break

      case "radial4":
      case "radial6":
      case "radial8":
        const segments = symmetryMode === "radial4" ? 4 : symmetryMode === "radial6" ? 6 : 8
        const angleStep = (Math.PI * 2) / segments

        for (let i = 0; i < segments; i++) {
          const angle = angleStep * i
          const endX = centerX + Math.cos(angle) * Math.min(centerX, centerY)
          const endY = centerY + Math.sin(angle) * Math.min(centerX, centerY)

          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        }
        break

      case "tiling":
        const tileWidth = canvas.width / 3
        const tileHeight = canvas.height / 3

        for (let i = 1; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(i * tileWidth, 0)
          ctx.lineTo(i * tileWidth, canvas.height)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(0, i * tileHeight)
          ctx.lineTo(canvas.width, i * tileHeight)
          ctx.stroke()
        }
        break
    }

    ctx.restore()
  }, [symmetryMode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = 800
    canvas.height = 600
    clearCanvas()
  }, [clearCanvas])

  useEffect(() => {
    clearCanvas()
    drawGuides()
  }, [symmetryMode, clearCanvas, drawGuides])

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
              <h1 className="text-2xl font-bold text-foreground">Symmetry & Tiling Painter</h1>
              <p className="text-muted-foreground">Create stunning symmetric patterns with real-time mirroring</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={clearCanvas} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button onClick={exportPattern} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PNG
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <canvas
                  ref={canvasRef}
                  className="border border-border rounded-lg cursor-crosshair w-full max-w-full"
                  style={{ aspectRatio: "4/3" }}
                  onMouseMove={handleMouseMove}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Click and drag to paint. Your strokes will be mirrored based on the selected symmetry mode.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Symmetry Modes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={symmetryMode === "none" ? "default" : "outline"}
                  onClick={() => setSymmetryMode("none")}
                  className="w-full justify-start"
                >
                  None
                </Button>

                <Button
                  variant={symmetryMode === "horizontal" ? "default" : "outline"}
                  onClick={() => setSymmetryMode("horizontal")}
                  className="w-full justify-start"
                >
                  <FlipHorizontal className="w-4 h-4 mr-2" />
                  Horizontal Mirror
                </Button>

                <Button
                  variant={symmetryMode === "vertical" ? "default" : "outline"}
                  onClick={() => setSymmetryMode("vertical")}
                  className="w-full justify-start"
                >
                  <FlipVertical className="w-4 h-4 mr-2" />
                  Vertical Mirror
                </Button>

                <Button
                  variant={symmetryMode === "radial4" ? "default" : "outline"}
                  onClick={() => setSymmetryMode("radial4")}
                  className="w-full justify-start"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  4-Fold Radial
                </Button>

                <Button
                  variant={symmetryMode === "radial6" ? "default" : "outline"}
                  onClick={() => setSymmetryMode("radial6")}
                  className="w-full justify-start"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  6-Fold Radial
                </Button>

                <Button
                  variant={symmetryMode === "radial8" ? "default" : "outline"}
                  onClick={() => setSymmetryMode("radial8")}
                  className="w-full justify-start"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  8-Fold Radial
                </Button>

                <Button
                  variant={symmetryMode === "tiling" ? "default" : "outline"}
                  onClick={() => setSymmetryMode("tiling")}
                  className="w-full justify-start"
                >
                  <Grid className="w-4 h-4 mr-2" />
                  Seamless Tiling
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Brush Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Size: {brushSize[0]}px</label>
                  <Slider value={brushSize} onValueChange={setBrushSize} min={1} max={50} step={1} className="w-full" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Opacity: {brushOpacity[0]}%</label>
                  <Slider
                    value={brushOpacity}
                    onValueChange={setBrushOpacity}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Select a symmetry mode to see guides</li>
                  <li>• Paint in one area to see mirrored strokes</li>
                  <li>• Radial modes create mandala patterns</li>
                  <li>• Tiling mode creates seamless patterns</li>
                  <li>• Export your creations as PNG files</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
