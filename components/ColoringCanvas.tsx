
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export type Region = { name: string; path: Path2D; color: string; locked?: boolean }
type DrawScene = (ctx: CanvasRenderingContext2D, w: number, h: number) => Region[]

const PALETTE = [
  ["#FFE35B","#FF8A38","#9BE169","#7FE4FF","#FFA0C8","#C9A67C"],
  ["#FFFFFF","#FF3B30","#36C56B","#3A82F7","#A98BE9","#8A5A2B"],
  ["#F6D7B0","#D01F48","#1F7A3E","#2C4DB3","#FF1E86","#5C3A13"],
]

export default function ColoringCanvas({
  title,
  drawScene,
  width = 900,
  height = 600,
}: {
  title: string
  drawScene: DrawScene
  width?: number
  height?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [selected, setSelected] = useState("#FFA0C8")

  const setupCanvas = () => {
    const c = canvasRef.current!
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    c.style.width = `${width}px`
    c.style.height = `${height}px`
    c.width = Math.floor(width * dpr)
    c.height = Math.floor(height * dpr)
    const ctx = c.getContext("2d")!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { ctx, dpr }
  }

  const paint = (ctx: CanvasRenderingContext2D, regs: Region[]) => {
    ctx.clearRect(0,0,width,height)
    regs.forEach(r => { ctx.fillStyle = r.color; ctx.fill(r.path) })
    ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.lineJoin = "round"; ctx.lineCap = "round"
    regs.forEach(r => ctx.stroke(r.path))
  }

  const render = () => {
    const { ctx } = setupCanvas()
    const regs = drawScene(ctx, width, height)
    setRegions(regs)
    paint(ctx, regs)
  }

  useEffect(() => { if (canvasRef.current) render() }, [drawScene, width, height])

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const rect = c.getBoundingClientRect()

    // Get CSS pixel coords inside the canvas element
    const cssX = e.clientX - rect.left
    const cssY = e.clientY - rect.top

    // Because we scale the context by DPR in setupCanvas(),
    // isPointInPath expects coordinates in the *scaled* user space.
    const dpr = Math.max(1, window.devicePixelRatio || 1)

    // Map CSS pixels -> logical size -> scale to DPR space
    const x = (cssX / rect.width)  * width  * dpr
    const y = (cssY / rect.height) * height * dpr

    const ctx = c.getContext("2d")!

    const next = [...regions]
    for (let i = next.length - 1; i >= 0; i--) {
      if (!next[i].locked && ctx.isPointInPath(next[i].path, x, y)) {
        next[i] = { ...next[i], color: selected }
        break
      }
    }
    setRegions(next)
    paint(ctx, next)
  }


  const reset = () => render()

  return (
    <div className="relative min-h-screen ">
      <main className="relative z-10 min-h-screen py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/coloring" className="inline-block mb-3">
              <span className="px-5 py-2 inline-block rounded-full font-semibold text-white text-sm shadow-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                ← Back to Gallery
              </span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{title}</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-6">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <div className="flex-1 border-4 border-blue-400 rounded-xl overflow-hidden shadow-lg bg-white">
                <canvas ref={canvasRef} onClick={onClick} className="cursor-pointer w-full h-auto" />
              </div>

              <div className="w-full lg:w-64 flex flex-col gap-4">
                <div className="flex lg:flex-col gap-3">
                  <button onClick={reset} className="flex-1 px-6 py-3 rounded-2xl font-bold text-purple-700 bg-white border-2 border-purple-400 shadow-lg hover:bg-purple-50">
                    🖌️ Clean
                  </button>
                  <Link href="/coloring" className="flex-1">
                    <button className="w-full px-6 py-3 rounded-2xl font-bold text-blue-700 bg-white border-2 border-blue-400 shadow-lg hover:bg-blue-50">
                      🏠 Home
                    </button>
                  </Link>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 shadow-inner">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">Choose Color</h3>
                  <div className="flex flex-col gap-2">
                    {PALETTE.map((row, i) => (
                      <div key={i} className="flex gap-2 justify-center">
                        {row.map((c) => (
                          <button key={c}
                            onClick={() => setSelected(c)}
                            style={{ backgroundColor: c }}
                            className={`w-12 h-12 rounded-lg border-2 ${selected===c ? "ring-4 ring-blue-500 scale-110 border-blue-600" : "border-gray-300 hover:scale-105"} shadow-md transition-all`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
