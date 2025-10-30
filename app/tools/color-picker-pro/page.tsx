"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { hexToRgb, parseRgb, rgbToHex } from "../lib/colors"

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

export default function ColorPickerPro() {
  const [hex, setHex] = useState("#4f46e5")
  const [rgb, setRgb] = useState("rgb(79, 70, 229)")

  const swatch = useMemo(() => {
    const hexParsed = hexToRgb(hex)
    const rgbParsed = parseRgb(rgb)
    if (hexParsed) return { hexValid: true, rgbValid: !!rgbParsed, color: hex }
    if (rgbParsed) return { hexValid: !!hexParsed, rgbValid: true, color: rgbToHex(rgbParsed) }
    return { hexValid: false, rgbValid: false, color: "#cccccc" }
  }, [hex, rgb])

  function syncFromHex(v: string) {
    setHex(v)
    const r = hexToRgb(v)
    if (r) setRgb(`rgb(${r.r}, ${r.g}, ${r.b})`)
  }

  function syncFromRgb(v: string) {
    setRgb(v)
    const r = parseRgb(v)
    if (r) setHex(rgbToHex(r))
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div>
      <main className="min-h-screen p-6">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
          {/* Back navigation */}
          <div className="mb-4">
            <BackButton hrefFallback="/tools" label="Back to Tools" />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">HEX</label>
              <input
                value={hex}
                onChange={(e) => syncFromHex(e.target.value)}
                className="w-full rounded-lg border p-2 bg-white/70"
              />
              <button onClick={() => copy(hex)} className="mt-2 text-sm underline">
                Copy HEX
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RGB</label>
              <input
                value={rgb}
                onChange={(e) => syncFromRgb(e.target.value)}
                className="w-full rounded-lg border p-2 bg-white/70"
              />
              <button onClick={() => copy(rgb)} className="mt-2 text-sm underline">
                Copy RGB
              </button>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-6 items-center">
            <div className="h-32 rounded-xl border" style={{ background: swatch.color as string }} />
            <div>
              <p className="text-sm opacity-70">Live preview on elements:</p>
              <button
                className="px-4 py-2 rounded-xl border mt-2"
                style={{ background: swatch.color as string, color: "white" }}
              >
                Button
              </button>
              <div className="mt-2 p-3 rounded-xl border" style={{ background: "white" }}>
                <span style={{ color: swatch.color as string }}>Colored text example</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
