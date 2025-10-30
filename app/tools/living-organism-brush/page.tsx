"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, RotateCcw, Play, Pause } from "lucide-react"

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const seedsRef = useRef<Seed[]>([])
  const nextSeedIdRef = useRef(1)

  // State
  const [isGrowing, setIsGrowing] = useState(false)
  const [growthSpeed, setGrowthSpeed] = useState([5])
  const [mutationRate, setMutationRate] = useState([20])
  const [branchingProbability, setBranchingProbability] = useState([15])
  const [blendMode, setBlendMode] = useState<BlendMode>("source-over")
  const [activeSeedsCount, setActiveSeedsCount] = useState(0)

  // Create a new seed
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

  // Grow a single branch
  const growBranch = useCallback(
    (branch: Branch, seed: Seed): void => {
      const canvas = canvasRef.current
      if (!canvas || branch.age > 100) return

      branch.age++
      branch.length += growthSpeed[0] * 0.1

      // Apply mutation to angle
      if (Math.random() < mutationRate[0] / 1000) {
        branch.angle += (Math.random() - 0.5) * 0.3
      }

      // Calculate new position
      const newX = branch.x + Math.cos(branch.angle) * branch.length
      const newY = branch.y + Math.sin(branch.angle) * branch.length

      // Check boundaries
      if (newX < 0 || newX > canvas.width || newY < 0 || newY > canvas.height) {
        return
      }

      // Branching logic
      if (
        branch.children.length === 0 &&
        branch.length > 10 &&
        Math.random() < branchingProbability[0] / 1000 &&
        branch.age > 20
      ) {
        const numBranches = Math.random() < 0.7 ? 2 : 3
        for (let i = 0; i < numBranches; i++) {
          const angleOffset = (Math.random() - 0.5) * Math.PI * 0.8
          const newBranch: Branch = {
            x: newX,
            y: newY,
            angle: branch.angle + angleOffset,
            length: 0,
            thickness: Math.max(1, branch.thickness * 0.7),
            age: 0,
            children: [],
            parent: branch,
          }
          branch.children.push(newBranch)
        }
      }

      // Grow children
      branch.children.forEach((child) => growBranch(child, seed))
    },
    [growthSpeed, mutationRate, branchingProbability],
  )

  // Draw a branch
  const drawBranch = useCallback((ctx: CanvasRenderingContext2D, branch: Branch, seed: Seed): void => {
    if (branch.length < 1) return

    const endX = branch.x + Math.cos(branch.angle) * branch.length
    const endY = branch.y + Math.sin(branch.angle) * branch.length

    // Calculate alpha based on age and thickness
    const alpha = Math.max(0.1, 1 - branch.age / 100) * 0.8

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = seed.color
    ctx.lineWidth = branch.thickness
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Add some organic variation to the stroke
    ctx.shadowColor = seed.color
    ctx.shadowBlur = 2

    ctx.beginPath()
    ctx.moveTo(branch.x, branch.y)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    ctx.restore()

    // Draw children
    branch.children.forEach((child) => drawBranch(ctx, child, seed))
  }, [])

  // Update and draw all organisms
  const updateOrganisms = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    // Set blend mode
    ctx.globalCompositeOperation = blendMode

    // Update each seed
    seedsRef.current = seedsRef.current.filter((seed) => {
      seed.age++
      seed.energy -= 0.1

      if (seed.energy <= 0) return false

      // Grow all branches
      seed.branches.forEach((branch) => growBranch(branch, seed))

      // Draw all branches
      seed.branches.forEach((branch) => drawBranch(ctx, branch, seed))

      return true
    })

    setActiveSeedsCount(seedsRef.current.length)

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over"
  }, [growBranch, drawBranch, blendMode])

  // Animation loop
  const animate = useCallback(() => {
    if (isGrowing) {
      updateOrganisms()
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [isGrowing, updateOrganisms])

  // Handle canvas click to plant seed
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      console.log("[v0] Planting seed at:", x, y)
      const newSeed = createSeed(x, y)
      seedsRef.current.push(newSeed)
      setActiveSeedsCount(seedsRef.current.length)
    },
    [createSeed],
  )

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.fillStyle = "#fdf2f8"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    seedsRef.current = []
    setActiveSeedsCount(0)
  }, [])

  // Toggle growth
  const toggleGrowth = useCallback(() => {
    setIsGrowing((prev) => !prev)
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = canvas.parentElement
    if (container) {
      const containerWidth = container.clientWidth - 32 // Account for padding
      const aspectRatio = 4 / 3
      canvas.width = Math.min(800, containerWidth)
      canvas.height = canvas.width / aspectRatio
    } else {
      canvas.width = 800
      canvas.height = 600
    }

    console.log("[v0] Canvas initialized with size:", canvas.width, canvas.height)
    clearCanvas()

    // Start animation loop
    const startAnimation = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      const animateLoop = () => {
        if (isGrowing) {
          updateOrganisms()
        }
        animationRef.current = requestAnimationFrame(animateLoop)
      }
      animateLoop()
    }

    startAnimation()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, []) // Removed dependencies to prevent recreation

  useEffect(() => {
    console.log("[v0] Growth state changed:", isGrowing)
  }, [isGrowing])

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
              <h1 className="text-2xl font-bold text-foreground">Living Organism Brush</h1>
              <p className="text-muted-foreground">Plant seeds that grow into organic fractal structures</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={toggleGrowth} variant={isGrowing ? "default" : "outline"}>
              {isGrowing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isGrowing ? "Pause" : "Play"} Growth
            </Button>
            <Button onClick={clearCanvas} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Canvas
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
                  className="border border-border rounded-lg cursor-crosshair w-full max-w-full bg-gradient-to-br from-background to-secondary/20"
                  style={{ aspectRatio: "4/3" }}
                  onClick={handleCanvasClick}
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Click anywhere to plant a seed. Seeds will grow automatically when growth is enabled.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DNA Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Growth Speed: {growthSpeed[0]}</label>
                  <Slider
                    value={growthSpeed}
                    onValueChange={setGrowthSpeed}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Mutation Rate: {mutationRate[0]}%</label>
                  <Slider
                    value={mutationRate}
                    onValueChange={setMutationRate}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Branching Probability: {branchingProbability[0]}%
                  </label>
                  <Slider
                    value={branchingProbability}
                    onValueChange={setBranchingProbability}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Blending Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={blendMode} onValueChange={(value: BlendMode) => setBlendMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source-over">Normal</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Different blend modes create unique visual effects when organisms overlap
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Seeds:</span>
                    <span className="font-medium">{activeSeedsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Growth Status:</span>
                    <span className={`font-medium ${isGrowing ? "text-green-600" : "text-orange-600"}`}>
                      {isGrowing ? "Growing" : "Paused"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Click to plant seeds anywhere on canvas</li>
                  <li>• Press Play to start organic growth</li>
                  <li>• Higher mutation creates more chaotic patterns</li>
                  <li>• Branching probability controls complexity</li>
                  <li>• Try different blend modes for unique effects</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
