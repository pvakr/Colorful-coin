"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const COLORS = [
  { hex: "#FFD60A", name: "Sunrise Gold", meaning: "Happiness & Energy — the day's spark." },
  { hex: "#FF3B30", name: "Blazing Red", meaning: "Passion & Vitality — bold action." },
  { hex: "#FF9500", name: "Lively Orange", meaning: "Connection & Creativity — playful flow." },
  { hex: "#34C759", name: "Emerald Green", meaning: "Growth & Harmony — nature's balance." },
  { hex: "#0A84FF", name: "Ocean Blue", meaning: "Wisdom & Calm — clear thinking." },
  { hex: "#5E5CE6", name: "Royal Indigo", meaning: "Mystery & Depth — intuition." },
  { hex: "#BF5AF2", name: "Vibrant Violet", meaning: "Dreams & Transformation — vision." },
]

export default function ColorGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="w-full max-w-6xl mx-auto px-6">
      <motion.h2
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        Color Meanings
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {COLORS.map((color, index) => (
          <motion.div
            key={color.name}
            className="group relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
          >
            {/* Glow border on hover */}
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
              style={{
                background: `linear-gradient(135deg, ${color.hex}, ${color.hex}80)`,
                zIndex: -1,
              }}
            />

            <div className="flex flex-col items-center text-center gap-4">
              {/* Color swatch with glow */}
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full shadow-xl ring-4 ring-white/30 group-hover:ring-white/50 transition-all duration-300"
                  style={{
                    backgroundColor: color.hex,
                    boxShadow: `0 8px 32px ${color.hex}40, inset 0 2px 0 rgba(255,255,255,0.3)`,
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-xl"
                  style={{ backgroundColor: color.hex }}
                />
              </div>

              <div>
                <h3
                  className="text-xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${color.hex}, white)`,
                  }}
                >
                  {color.name}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed font-medium">{color.meaning}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
