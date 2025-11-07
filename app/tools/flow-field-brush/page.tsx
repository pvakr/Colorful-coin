"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RotateCcw } from "lucide-react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

export default function FlowFieldBrushPage() {
const canvasRef = useRef<HTMLCanvasElement | null>(null)
const animationRef = useRef<number | null>(null) // ✅ provide null as initial
const particlesRef = useRef<Particle[]>([])      // ✅ empty array is fine
const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, speed: 0 }) // ✅ initial object
const isDrawingRef = useRef(false)  

  // Control states
  const [noiseScale, setNoiseScale] = useState([0.01])
  const [particleCount, setParticleCount] = useState([50])
  const [trailLength, setTrailLength] = useState([20])

  // Simple Perlin noise implementation
  const noise = useCallback((x: number, y: number): number => {
    const p = new Array(512)
    const permutation = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240,
      21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88,
      237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83,
      111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216,
      80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186,
      3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58,
      17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
      129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193,
      238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128,
      195, 78, 66, 215, 61, 156, 180,
    ]

    for (let i = 0; i < 256; i++) {
      p[256 + i] = p[i] = permutation[i]
    }

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
    const lerp = (t: number, a: number, b: number) => a + t * (b - a)
    const grad = (hash: number, x: number, y: number) => {
      const h = hash & 15
      const u = h < 8 ? x : y
      const v = h < 4 ? y : h === 12 || h === 14 ? x : 0
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
    }

    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = fade(x)
    const v = fade(y)
    const A = p[X] + Y
    const AA = p[A]
    const AB = p[A + 1]
    const B = p[X + 1] + Y
    const BA = p[B]
    const BB = p[B + 1]

    return lerp(
      v,
      lerp(u, grad(p[AA], x, y), grad(p[BA], x - 1, y)),
      lerp(u, grad(p[AB], x, y - 1), grad(p[BB], x - 1, y - 1)),
    )
  }, [])

  const createParticle = useCallback(
    (x: number, y: number): Particle => {
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        life: trailLength[0],
        maxLife: trailLength[0],
      }
    },
    [trailLength],
  )

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scale = noiseScale[0]
    const speed = mouseRef.current.speed

    particlesRef.current = particlesRef.current.filter((particle) => {
      // Update particle based on flow field
      const angle = noise(particle.x * scale, particle.y * scale) * Math.PI * 2 * (1 + speed * 0.1)
      particle.vx = Math.cos(angle) * 2
      particle.vy = Math.sin(angle) * 2

      particle.x += particle.vx
      particle.y += particle.vy
      particle.life--

      // Draw particle
      const alpha = particle.life / particle.maxLife
      ctx.globalAlpha = alpha * 0.8
      ctx.fillStyle = `hsl(${320 + speed * 20}, 70%, ${50 + alpha * 30}%)`
      ctx.fillRect(particle.x, particle.y, 2, 2)

      return (
        particle.life > 0 && particle.x > 0 && particle.x < canvas.width && particle.y > 0 && particle.y < canvas.height
      )
    })
  }, [noise, noiseScale])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fade effect instead of clearing
    ctx.globalAlpha = 0.05
    ctx.fillStyle = "#fdf2f8"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = 1

    updateParticles()
    animationRef.current = requestAnimationFrame(animate)
  }, [updateParticles])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Calculate mouse speed
      const dx = x - mouseRef.current.x
      const dy = y - mouseRef.current.y
      mouseRef.current.speed = Math.sqrt(dx * dx + dy * dy) * 0.1

      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x = x
      mouseRef.current.y = y

      if (isDrawingRef.current) {
        // Add particles based on particle count setting
        for (let i = 0; i < particleCount[0] / 10; i++) {
          const offsetX = (Math.random() - 0.5) * 20
          const offsetY = (Math.random() - 0.5) * 20
          particlesRef.current.push(createParticle(x + offsetX, y + offsetY))
        }
      }
    },
    [particleCount, createParticle],
  )

  const handleMouseDown = useCallback(() => {
    isDrawingRef.current = true
  }, [])

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#fdf2f8"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    particlesRef.current = []
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 600

    // Initialize canvas
    clearCanvas()

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate, clearCanvas])

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
              <h1 className="text-2xl font-bold text-foreground">Flow-Field Brush</h1>
              <p className="text-muted-foreground">Paint with dynamic Perlin noise flow fields</p>
            </div>
          </div>
          <Button onClick={clearCanvas} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear Canvas
          </Button>
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
                  Click and drag to paint. Cursor speed controls the chaos of the flow field.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Noise Scale: {noiseScale[0].toFixed(3)}</label>
                  <Slider
                    value={noiseScale}
                    onValueChange={setNoiseScale}
                    min={0.001}
                    max={0.05}
                    step={0.001}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Particle Count: {particleCount[0]}</label>
                  <Slider
                    value={particleCount}
                    onValueChange={setParticleCount}
                    min={10}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Trail Length: {trailLength[0]}</label>
                  <Slider
                    value={trailLength}
                    onValueChange={setTrailLength}
                    min={5}
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
                  <li>• Click and drag to paint</li>
                  <li>• Move cursor faster for more chaos</li>
                  <li>• Adjust noise scale for flow complexity</li>
                  <li>• Increase particle count for denser strokes</li>
                  <li>• Longer trails create flowing effects</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
