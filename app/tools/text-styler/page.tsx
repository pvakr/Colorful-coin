"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"

// ---- Reusable Back Button (inline) ----
function BackButton({
  label = "Back to Tools",
  hrefFallback = "/tools",
  className = "",
}: { label?: string; hrefFallback?: string; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const goBack = useCallback(() => {
    if (typeof window === "undefined") return router.push(hrefFallback)

    const ref = document.referrer
    const hasHistory = window.history.length > 1

    const sameOrigin = !!ref && (() => {
      try { return new URL(ref).origin === window.location.origin } catch { return false }
    })()

    const notSelf = !!ref && (() => {
      try { return new URL(ref).pathname !== pathname } catch { return true }
    })()

    if (hasHistory && sameOrigin && notSelf) {
      router.back()
    } else {
      router.push(hrefFallback)
    }
  }, [router, hrefFallback, pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); goBack() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goBack])

  return (
    <motion.button
      onClick={goBack}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-slate-800 ring-1 ring-black/5 shadow hover:bg-white ${className}`}
      aria-label="Go back"
    >
      <span className="text-lg">←</span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  )
}

export default function TextStyler() {
  const [text, setText] = useState("Gradient Magic ✨")
  const [useGradient, setUseGradient] = useState(true)
  const [solid, setSolid] = useState("#111827")
  const [from, setFrom] = useState("#a78bfa")
  const [to, setTo] = useState("#60a5fa")
  const [shadow, setShadow] = useState({ x: 0, y: 2, blur: 8, color: "rgba(0,0,0,0.25)" })

  const style = useMemo(() => {
    const base: any = { textShadow: `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color}` }
    if (useGradient) {
      base.backgroundImage = `linear-gradient(90deg, ${from}, ${to})`
      ;(base as any).WebkitBackgroundClip = "text"
      base.color = "transparent"
    } else {
      base.color = solid
    }
    return base
  }, [useGradient, solid, from, to, shadow])

  const css = useMemo(() => {
    const parts = [
      useGradient
        ? `background-image: linear-gradient(90deg, ${from}, ${to});
-webkit-background-clip: text;
color: transparent;`
        : `color: ${solid};`,
      `text-shadow: ${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color};`,
    ]
    return parts.join("\n")
  }, [useGradient, solid, from, to, shadow])

  return (
    <div>
      <main className="min-h-screen p-6">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
          {/* Back navigation */}
          <div className="mb-4">
            <BackButton hrefFallback="/tools" label="Back to Tools" />
          </div>

          <h1 className="text-xl font-bold mb-3">Text Styler</h1>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium">Text</label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-lg border p-2 bg-white/70"
              />

              <div className="flex items-center gap-2 mt-2">
                <input id="grad" type="checkbox" checked={useGradient} onChange={(e) => setUseGradient(e.target.checked)} />
                <label htmlFor="grad" className="text-sm">
                  Use gradient
                </label>
              </div>

              {!useGradient && (
                <div>
                  <label className="block text-sm font-medium">Solid Color</label>
                  <input type="color" value={solid} onChange={(e) => setSolid(e.target.value)} />
                </div>
              )}

              {useGradient && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">From</label>
                    <input type="color" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">To</label>
                    <input type="color" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Shadow X</label>
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    value={shadow.x}
                    onChange={(e) => setShadow((s) => ({ ...s, x: +e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Shadow Y</label>
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    value={shadow.y}
                    onChange={(e) => setShadow((s) => ({ ...s, y: +e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Blur</label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={shadow.blur}
                    onChange={(e) => setShadow((s) => ({ ...s, blur: +e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Shadow Color</label>
                  <input
                    value={shadow.color}
                    onChange={(e) => setShadow((s) => ({ ...s, color: e.target.value }))}
                    className="w-full rounded-lg border p-2 bg-white/70"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">CSS</div>
                <pre className="rounded-xl border bg-white/70 p-3 text-xs overflow-x-auto">{css}</pre>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-4xl sm:text-5xl font-extrabold" style={style}>
                {text}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
