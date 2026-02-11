"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, Play, Pause } from "lucide-react"

interface Seed {
  id: number
  x: number
  y: number
  branches: Branch[]
  age: number
  energy: number
  color: string
}

interface Branch {
  x: number
  y: number
  angle: number
  length: number
  thickness: number
  age: number
  children: Branch[]
  parent?: Branch
}

type BlendMode = "source-over" | "multiply" | "screen" | "overlay"

export default function LivingOrganismBrushPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const seedsRef = useRef<Seed[]>([])
  const nextSeedIdRef = useRef<number>(1)

  // State
  const [isGrowing, setIsGrowing] = useState(false)
  const [growthSpeed, setGrowthSpeed] = useState<number[]>([5])
  const [mutationRate, setMutationRate] = useState<number[]>([20])
  const [branchingProbability, setBranchingProbability] = useState<number[]>([15])
  const [blendMode, setBlendMode] = useState<BlendMode>("source-over")
  const [activeSeedsCount, setActiveSeedsCount] = useState(0)

  // Create seed
  const createSeed = useCallback((x: number, y: number): Seed => {
    const hue = Math.random() * 360
    return {
      id: nextSeedIdRef.current++,
      x,
      y,
      branches: [
        {
          x,
          y,
          angle: Math.random() * Math.PI * 2,
          length: 0,
          thickness: 3,
          age: 0,
          children: [],
        },
      ],
      age: 0,
      energy: 100,
      color: `hsl(${hue}, 70%, 50%)`,
    }
  }, [])

  // Grow branch
  const growBranch = useCallback(
    (branch: Branch) => {
      const canvas = canvasRef.current
      if (!canvas || branch.age > 100) return

      branch.age++
      branch.length += growthSpeed[0] * 0.1

      if (Math.random() < mutationRate[0] / 1000) {
        branch.angle += (Math.random() - 0.5) * 0.3
      }

      const newX = branch.x + Math.cos(branch.angle) * branch.length
      const newY = branch.y + Math.sin(branch.angle) * branch.length

      if (newX < 0 || newX > canvas.width || newY < 0 || newY > canvas.height) {
        return
      }

      if (
        branch.children.length === 0 &&
        branch.length > 10 &&
        Math.random() < branchingProbability[0] / 1000 &&
        branch.age > 20
      ) {
        const count = Math.random() < 0.7 ? 2 : 3
        for (let i = 0; i < count; i++) {
          branch.children.push({
            x: newX,
            y: newY,
            angle: branch.angle + (Math.random() - 0.5) * Math.PI * 0.8,
            length: 0,
            thickness: Math.max(1, branch.thickness * 0.7),
            age: 0,
            children: [],
            parent: branch,
          })
        }
      }

      branch.children.forEach(growBranch)
    },
    [growthSpeed, mutationRate, branchingProbability]
  )

  // Draw branch
  const drawBranch = useCallback(
    (ctx: CanvasRenderingContext2D, branch: Branch, seed: Seed) => {
      if (branch.length < 1) return

      const endX = branch.x + Math.cos(branch.angle) * branch.length
      const endY = branch.y + Math.sin(branch.angle) * branch.length

      ctx.save()
      ctx.globalAlpha = Math.max(0.1, 1 - branch.age / 100) * 0.8
      ctx.strokeStyle = seed.color
      ctx.lineWidth = branch.thickness
      ctx.lineCap = "round"
      ctx.shadowColor = seed.color
      ctx.shadowBlur = 2

      ctx.beginPath()
      ctx.moveTo(branch.x, branch.y)
      ctx.lineTo(endX, endY)
      ctx.stroke()
      ctx.restore()

      branch.children.forEach((child) => drawBranch(ctx, child, seed))
    },
    []
  )

  // Update organisms
  const updateOrganisms = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.globalCompositeOperation = blendMode

    seedsRef.current = seedsRef.current.filter((seed) => {
      seed.energy -= 0.1
      if (seed.energy <= 0) return false

      seed.branches.forEach(growBranch)
      seed.branches.forEach((b) => drawBranch(ctx, b, seed))
      return true
    })

    setActiveSeedsCount(seedsRef.current.length)
    ctx.globalCompositeOperation = "source-over"
  }, [blendMode, growBranch, drawBranch])

  // Animation loop
  useEffect(() => {
    const loop = () => {
      if (isGrowing) updateOrganisms()
      animationRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isGrowing, updateOrganisms])

  // Canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    seedsRef.current.push(createSeed(x, y))
    setActiveSeedsCount(seedsRef.current.length)
  }

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.fillStyle = "#fdf2f8"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    seedsRef.current = []
    setActiveSeedsCount(0)
  }

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 800
    canvas.height = 600
    clearCanvas()
  }, [])

  return (
    <main className="min-h-screen p-6">
      <section className="mx-auto max-w-6xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Living Organism Brush</h1>
            <p className="text-muted-foreground">
              Plant seeds that grow into organic fractal structures
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsGrowing((v) => !v)}>
              {isGrowing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isGrowing ? "Pause" : "Play"}
            </Button>
            <Button variant="outline" onClick={clearCanvas}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="w-full rounded-lg border cursor-crosshair"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>DNA Controls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Slider value={growthSpeed} onValueChange={setGrowthSpeed} min={1} max={20} />
                <Slider value={mutationRate} onValueChange={setMutationRate} min={0} max={100} />
                <Slider value={branchingProbability} onValueChange={setBranchingProbability} min={1} max={50} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Blend Mode</CardTitle></CardHeader>
              <CardContent>
                <Select value={blendMode} onValueChange={(v) => setBlendMode(v as BlendMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source-over">Normal</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
              <CardContent>Active Seeds: {activeSeedsCount}</CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
