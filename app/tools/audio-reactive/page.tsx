"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, RotateCcw, Mic, MicOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AudioData {
  volume: number
  bass: number
  treble: number
  frequencies: Uint8Array
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
  saturation: number
  life: number
  maxLife: number
}

export default function AudioReactivePage() {
  // Canvas / audio graph refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const visualizerRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const isDrawingRef = useRef<boolean>(false)
  const { toast } = useToast()

  // UI state (slow-changing / user-facing)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0,
    bass: 0,
    treble: 0,
    frequencies: new Uint8Array(256),
  })
  const [sensitivity, setSensitivity] = useState<number[]>([50])
  const [baseColor, setBaseColor] = useState("#be123c")

  // Fast-changing refs used by the render loop
  const audioDataRef = useRef<AudioData>({
    volume: 0,
    bass: 0,
    treble: 0,
    frequencies: new Uint8Array(256),
  })
  const isAudioEnabledRef = useRef(false)
  const sensitivityRef = useRef<number[]>([50])
  const baseColorRef = useRef("#be123c")

  // Keep refs in sync with state
  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled
  }, [isAudioEnabled])

  useEffect(() => {
    sensitivityRef.current = sensitivity
  }, [sensitivity])

  useEffect(() => {
    baseColorRef.current = baseColor
  }, [baseColor])

  // Throttle UI numbers (copy ref → state every 200ms)
  useEffect(() => {
    const id = setInterval(() => {
      setAudioData({ ...audioDataRef.current })
    }, 200)
    return () => clearInterval(id)
  }, [])

  // Initialize audio context and microphone
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const AC: typeof AudioContext =
        (window as any).AudioContext ?? (window as any).webkitAudioContext
      audioContextRef.current = new AC()

      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)

      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = 0.8
      microphoneRef.current.connect(analyserRef.current)

      setIsAudioEnabled(true)
      toast({
        title: "Audio enabled!",
        description: "Microphone is now connected to your brush",
      })
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Audio access denied",
        description: "Please allow microphone access to use audio-reactive features",
        variant: "destructive",
      })
    }
  }, [toast])

  // Stop audio
  const stopAudio = useCallback(() => {
    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
      microphoneRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setIsAudioEnabled(false)

    const reset = {
      volume: 0,
      bass: 0,
      treble: 0,
      frequencies: new Uint8Array(256),
    }
    audioDataRef.current = reset
    setAudioData(reset)
  }, [])

  // Analyze audio — writes to ref only (no setState)
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    const volume = dataArray.reduce((sum, v) => sum + v, 0) / bufferLength / 255
    const bassRange = Math.max(1, Math.floor(bufferLength * 0.1))
    const bass =
      dataArray.slice(0, bassRange).reduce((s, v) => s + v, 0) / bassRange / 255
    const trebleStart = Math.floor(bufferLength * 0.7)
    const treble =
      dataArray.slice(trebleStart).reduce((s, v) => s + v, 0) /
      Math.max(1, bufferLength - trebleStart) /
      255

    audioDataRef.current = {
      volume,
      bass,
      treble,
      frequencies: dataArray,
    }
  }, [])

  // Create particle using refs (no dependencies)
  const createParticle = (x: number, y: number): Particle => {
    const { volume, bass, treble } = audioDataRef.current
    const sens = sensitivityRef.current[0]
    const volumeMultiplier = 1 + volume * (sens / 50)
    const bassInfluence = bass * 100
    const trebleInfluence = treble * 50

    // Parse base color to HSL
    const hex = baseColorRef.current.replace("#", "")
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    let l = (max + min) / 2

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
      x,
      y,
      vx: (Math.random() - 0.5) * 4 * volumeMultiplier,
      vy: (Math.random() - 0.5) * 4 * volumeMultiplier,
      size: Math.max(2, 8 * volumeMultiplier),
      hue: (h * 360 + trebleInfluence) % 360,
      saturation: Math.min(100, s * 100 + bassInfluence),
      life: Math.max(20, 60 + trebleInfluence),
      maxLife: Math.max(20, 60 + trebleInfluence),
    }
  }

  // Update particles — uses refs only
  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.98
      p.vy *= 0.98
      p.life--

      if (isAudioEnabledRef.current) {
        const { treble, volume } = audioDataRef.current
        p.vx += (Math.random() - 0.5) * treble * 2
        p.vy += (Math.random() - 0.5) * treble * 2
        p.size = Math.max(1, p.size + (volume - 0.5) * 2)
      }

      const alpha = p.life / p.maxLife
      ctx.save()
      ctx.globalAlpha = alpha * 0.8
      ctx.fillStyle = `hsl(${p.hue}, ${p.saturation}%, 60%)`
      ctx.shadowColor = `hsl(${p.hue}, ${p.saturation}%, 60%)`
      ctx.shadowBlur = p.size * 0.5
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      return (
        p.life > 0 &&
        p.x > -50 &&
        p.x < canvas.width + 50 &&
        p.y > -50 &&
        p.y < canvas.height + 50
      )
    })
  }, [])

  // Draw audio visualizer — uses refs only
  const drawVisualizer = useCallback(() => {
    const canvas = visualizerRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !isAudioEnabledRef.current) return

    ctx.fillStyle = "rgba(253, 242, 248, 0.3)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const { frequencies, volume } = audioDataRef.current
    const barWidth = canvas.width / frequencies.length

    ctx.fillStyle = "#be123c"
    for (let i = 0; i < frequencies.length; i++) {
      const barHeight = (frequencies[i] / 255) * canvas.height
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight)
    }

    ctx.fillStyle = "#ec4899"
    ctx.fillRect(0, 0, canvas.width * volume, 4)
  }, [])

  // Animation loop (defined once; reads from refs)
  useEffect(() => {
    const canvas = canvasRef.current
    const visualizer = visualizerRef.current

    if (canvas) {
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#fdf2f8"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    if (visualizer) {
      visualizer.width = 400
      visualizer.height = 100
    }

    const loop = () => {
      if (isAudioEnabledRef.current) analyzeAudio()

      const c = canvasRef.current
      const ctx = c?.getContext("2d")
      if (c && ctx) {
        ctx.fillStyle = "rgba(253, 242, 248, 0.05)"
        ctx.fillRect(0, 0, c.width, c.height)
      }

      updateParticles()
      drawVisualizer()

      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      stopAudio()
    }
    // intentionally empty deps so this runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const particleCount = isAudioEnabledRef.current
      ? Math.max(1, Math.floor(audioDataRef.current.volume * 10))
      : 3

    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * 20
      const offsetY = (Math.random() - 0.5) * 20
      particlesRef.current.push(createParticle(x + offsetX, y + offsetY))
    }
  }, [])

  const handleMouseDown = useCallback(() => {
    isDrawingRef.current = true
  }, [])
  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.fillStyle = "#fdf2f8"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    particlesRef.current = []
  }, [])

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
              <h1 className="text-2xl font-bold text-foreground">Audio-Reactive Painting</h1>
              <p className="text-muted-foreground">
                Let sound control your brush dynamics and colors
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={isAudioEnabled ? stopAudio : initializeAudio}
              variant={isAudioEnabled ? "default" : "outline"}
            >
              {isAudioEnabled ? (
                <Mic className="w-4 h-4 mr-2" />
              ) : (
                <MicOff className="w-4 h-4 mr-2" />
              )}
              {isAudioEnabled ? "Audio On" : "Enable Audio"}
            </Button>
            <Button onClick={clearCanvas} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Canvas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3 space-y-4">
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
                  {isAudioEnabled
                    ? "Click and drag to paint. Your brush responds to microphone input!"
                    : "Enable audio to make your brush respond to sound. Click and drag to paint normally."}
                </p>
              </CardContent>
            </Card>

            {/* Audio Visualizer */}
            {isAudioEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audio Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <canvas
                    ref={visualizerRef}
                    className="w-full border border-border rounded bg-background"
                    style={{ height: "100px" }}
                  />
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground">Volume</div>
                      <div className="font-mono">
                        {(audioData.volume * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Bass</div>
                      <div className="font-mono">
                        {(audioData.bass * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Treble</div>
                      <div className="font-mono">
                        {(audioData.treble * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audio Mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume →</span>
                    <span>Brush Size</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bass →</span>
                    <span>Color Saturation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Treble →</span>
                    <span>Mutation Rate</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Base Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Audio Sensitivity: {sensitivity[0]}%
                  </label>
                  <Slider
                    value={sensitivity}
                    onValueChange={setSensitivity}
                    min={10}
                    max={200}
                    step={10}
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
                  <li>• Enable audio to activate reactive features</li>
                  <li>• Speak, sing, or play music near your mic</li>
                  <li>• Louder sounds create bigger brushes</li>
                  <li>• Bass frequencies boost color saturation</li>
                  <li>• High frequencies add chaos and movement</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
