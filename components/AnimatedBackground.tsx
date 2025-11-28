"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Color palette
    const colors = [
      { r: 255, g: 107, b: 107 }, // Coral red
      { r: 78, g: 205, b: 196 }, // Turquoise
      { r: 69, g: 183, b: 209 }, // Sky blue
      { r: 150, g: 206, b: 180 }, // Mint green
      { r: 255, g: 234, b: 167 }, // Warm yellow
      { r: 221, g: 160, b: 221 }, // Plum
      { r: 152, g: 216, b: 200 }, // Seafoam
      { r: 247, g: 220, b: 111 }, // Golden yellow
    ]

    let time = 0

    const animate = () => {
      time += 0.002 // Speed control

      // Create gradient points that move in wave patterns
      const gradient1X = canvas.width * (0.3 + Math.sin(time * 1.1) * 0.2)
      const gradient1Y = canvas.height * (0.3 + Math.cos(time * 0.9) * 0.2)

      const gradient2X = canvas.width * (0.7 + Math.sin(time * 0.8) * 0.2)
      const gradient2Y = canvas.height * (0.6 + Math.cos(time * 1.2) * 0.2)

      const gradient3X = canvas.width * (0.5 + Math.sin(time * 1.5) * 0.15)
      const gradient3Y = canvas.height * (0.8 + Math.cos(time * 0.7) * 0.15)

      // Create multiple radial gradients
      const gradient1 = ctx.createRadialGradient(gradient1X, gradient1Y, 0, gradient1X, gradient1Y, canvas.width * 0.6)

      const color1Index = Math.floor(time * 0.3) % colors.length
      const color2Index = (color1Index + 2) % colors.length
      const color3Index = (color1Index + 4) % colors.length
      const color4Index = (color1Index + 6) % colors.length

      const c1 = colors[color1Index]
      const c2 = colors[color2Index]
      const c3 = colors[color3Index]
      const c4 = colors[color4Index]

      gradient1.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.6)`)
      gradient1.addColorStop(1, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0)`)

      const gradient2 = ctx.createRadialGradient(gradient2X, gradient2Y, 0, gradient2X, gradient2Y, canvas.width * 0.6)
      gradient2.addColorStop(0, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.6)`)
      gradient2.addColorStop(1, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0)`)

      const gradient3 = ctx.createRadialGradient(gradient3X, gradient3Y, 0, gradient3X, gradient3Y, canvas.width * 0.5)
      gradient3.addColorStop(0, `rgba(${c3.r}, ${c3.g}, ${c3.b}, 0.5)`)
      gradient3.addColorStop(1, `rgba(${c3.r}, ${c3.g}, ${c3.b}, 0)`)

      // Base gradient for overall tone
      const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      baseGradient.addColorStop(0, `rgba(${c4.r}, ${c4.g}, ${c4.b}, 0.3)`)
      baseGradient.addColorStop(0.5, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.2)`)
      baseGradient.addColorStop(1, `rgba(${c3.r}, ${c3.g}, ${c3.b}, 0.3)`)

      // Clear and draw
      ctx.fillStyle = baseGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = gradient3
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          filter: "blur(80px) saturate(1.4) contrast(1.1)",
        }}
      />

      {/* Soft paint-like overlays */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(255, 107, 107, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(78, 205, 196, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(150, 206, 180, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(221, 160, 221, 0.25) 0%, transparent 50%)
          `,
          animation: "paintFlow 20s ease-in-out infinite",
        }}
      />

      <style jsx>{`
        @keyframes paintFlow {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.2; }
          25% { transform: scale(1.1) rotate(90deg); opacity: 0.3; }
          50% { transform: scale(0.9) rotate(180deg); opacity: 0.15; }
          75% { transform: scale(1.05) rotate(270deg); opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}
