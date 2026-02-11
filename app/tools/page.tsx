"use client"

import type React from "react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// UI
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Icons
import {
  Palette,
  Waves,
  Zap,
  Sprout,
  Volume2,
  CalendarCheck,
  Lightbulb,
  Shuffle,
  Paintbrush,
  Blend,
  Type,
  Droplet,
  Ruler,
  Image,
  Brain,
  SprayCan,
  Focus,
  Search,
  Sparkles,
  Layers,
} from "lucide-react"

import PageTransition from "@/components/PageTransition"

type ToolCategory = "All" | "Painting" | "Color" | "Text" | "Experimental"

type ToolItem = {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  glow: string
  category: ToolCategory
  badge?: string
}

// --- Tool Card ---
function ToolLink({
  href,
  icon,
  title,
  description,
  color,
  glow,
  delay,
  badge,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  glow: string
  delay: number
  badge?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      <Link href={href} className="block">
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
          <Card
            className={[
              "group relative overflow-hidden cursor-pointer border-0",
              "bg-white/7 backdrop-blur-xl",
              "ring-1 ring-white/15 hover:ring-white/25",
              "transition-all duration-300",
              "hover:shadow-2xl",
              glow,
            ].join(" ")}
          >
            {/* gradient border */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
            </div>

            {/* subtle sheen */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/10 blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-300" />

            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <motion.div
                  className={[
                    "shrink-0 rounded-xl p-2.5",
                    "bg-white/10 ring-1 ring-white/15",
                    "backdrop-blur",
                    color,
                  ].join(" ")}
                  whileHover={{ rotate: 6, scale: 1.05 }}
                  transition={{ duration: 0.18 }}
                >
                  {icon}
                </motion.div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg text-white drop-shadow">
                      {title}
                    </CardTitle>

                    {badge ? (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/10 ring-1 ring-white/15 text-white/80">
                        {badge}
                      </span>
                    ) : null}
                  </div>

                  <CardDescription className="mt-1 text-sm text-white/70 leading-snug">
                    {description}
                  </CardDescription>
                </div>

                <div className="ml-auto mt-1 text-white/40 group-hover:text-white/70 transition-colors">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  )
}

function CategoryPill({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: ToolCategory
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-white/20 text-white shadow-lg"
          : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
      ].join(" ")}
      type="button"
    >
      <span className="opacity-90">{icon}</span>
      {label}
    </button>
  )
}

export default function ToolsPage() {
  const tools: ToolItem[] = useMemo(
    () => [
      // Painting
      {
        href: "/tools/flow-field-brush",
        icon: <Waves className="w-6 h-6" />,
        title: "Flow-Field Brush",
        description: "Paint with dynamic flow fields controlled by Perlin noise",
        color: "text-blue-300",
        glow: "hover:shadow-blue-500/20",
        category: "Painting",
        badge: "Popular",
      },
      {
        href: "/tools/symmetry-painter",
        icon: <Zap className="w-6 h-6" />,
        title: "Symmetry & Tiling Painter",
        description: "Create symmetric patterns with real-time mirroring",
        color: "text-green-300",
        glow: "hover:shadow-green-500/20",
        category: "Painting",
      },
      {
        href: "/tools/living-organism-brush",
        icon: <Sprout className="w-6 h-6" />,
        title: "Living Organism Brush",
        description: "Plant seeds that grow into organic fractal structures",
        color: "text-orange-300",
        glow: "hover:shadow-orange-500/20",
        category: "Experimental",
        badge: "New",
      },
      {
        href: "/tools/audio-reactive",
        icon: <Volume2 className="w-6 h-6" />,
        title: "Audio-Reactive Painting",
        description: "Let sound control your brush dynamics and colors",
        color: "text-indigo-300",
        glow: "hover:shadow-indigo-500/20",
        category: "Experimental",
      },
      {
        href: "/tools/light",
        icon: <Lightbulb className="w-6 h-6" />,
        title: "Light Painter",
        description: "Draw with glowing strokes of simulated neon light",
        color: "text-yellow-300",
        glow: "hover:shadow-yellow-500/20",
        category: "Painting",
      },
      {
        href: "/tools/paint",
        icon: <Paintbrush className="w-6 h-6" />,
        title: "Realistic Paint Simulator",
        description: "Mix, smear, and blend digital paint like real oils",
        color: "text-red-300",
        glow: "hover:shadow-red-500/20",
        category: "Painting",
        badge: "Pro",
      },

      // Color
      {
        href: "/tools/palette-generator",
        icon: <Palette className="w-6 h-6" />,
        title: "Palette Generator + Picker",
        description: "Generate and manage harmonious color palettes",
        color: "text-purple-300",
        glow: "hover:shadow-purple-500/20",
        category: "Color",
      },
      {
        href: "/tools/match",
        icon: <Shuffle className="w-6 h-6" />,
        title: "Color Match Maker",
        description: "Find perfect color matches and complementary blends",
        color: "text-teal-300",
        glow: "hover:shadow-teal-500/20",
        category: "Color",
      },
      {
        href: "/tools/gradient-maker",
        icon: <Blend className="w-6 h-6" />,
        title: "Gradient Maker",
        description: "Generate linear & radial gradients, export CSS or images",
        color: "text-rose-300",
        glow: "hover:shadow-rose-500/20",
        category: "Color",
      },
      {
        href: "/tools/color-picker-pro",
        icon: <Droplet className="w-6 h-6" />,
        title: "Color Picker Pro",
        description: "Pick colors, preview instantly, and copy HEX/RGB",
        color: "text-emerald-300",
        glow: "hover:shadow-emerald-500/20",
        category: "Color",
      },
      {
        href: "/tools/ColorHarmonyAnalyzer",
        icon: <Ruler className="w-6 h-6" />,
        title: "Color Harmony Analyzer",
        description: "Analyze color schemes for established harmonic rules",
        color: "text-violet-300",
        glow: "hover:shadow-violet-500/20",
        category: "Color",
      },
      {
        href: "/tools/ImageDominanceExtractor",
        icon: <Image className="w-6 h-6" />,
        title: "Image Dominance Extractor",
        description: "Extract the most dominant colors from any uploaded image",
        color: "text-amber-300",
        glow: "hover:shadow-amber-500/20",
        category: "Color",
        badge: "Hot",
      },
      {
        href: "/tools/AIMoodPaletteGenerator",
        icon: <Brain className="w-6 h-6" />,
        title: "AI Mood Palette Generator",
        description: "Generate palettes based on text prompts & emotion keywords",
        color: "text-sky-300",
        glow: "hover:shadow-sky-500/20",
        category: "Experimental",
      },
      {
        href: "/tools/ColorRelativityTester",
        icon: <Ruler className="w-6 h-6" />,
        title: "Color Relativity Tester",
        description: "See how surrounding colors change a center color's feel",
        color: "text-pink-300",
        glow: "hover:shadow-pink-500/20",
        category: "Color",
      },
      {
        href: "/tools/RealisticPaintMixer",
        icon: <SprayCan className="w-6 h-6" />,
        title: "Realistic Paint Mixer",
        description: "Virtually mix primary & secondary colors like physical paint",
        color: "text-red-300",
        glow: "hover:shadow-red-500/20",
        category: "Color",
      },
      {
        href: "/tools/FocusColorSpotlight",
        icon: <Focus className="w-6 h-6" />,
        title: "Focus Color Spotlight",
        description: "Isolate & highlight a single color across an entire canvas",
        color: "text-yellow-300",
        glow: "hover:shadow-yellow-500/20",
        category: "Color",
      },

      // Text + Productivity
      {
        href: "/tools/text-styler",
        icon: <Type className="w-6 h-6" />,
        title: "Text Styler",
        description: "Style text with colors, shadows, and gradient effects",
        color: "text-blue-300",
        glow: "hover:shadow-blue-500/20",
        category: "Text",
      },
      {
        href: "/tools/color-habit-tracker",
        icon: <CalendarCheck className="w-6 h-6" />,
        title: "Color Habit Tracker",
        description: "Track your daily creativity through color journaling",
        color: "text-fuchsia-300",
        glow: "hover:shadow-fuchsia-500/20",
        category: "Text",
      },
    ],
    []
  )

  const categories: ToolCategory[] = ["All", "Painting", "Color", "Text", "Experimental"]
  const [activeCategory, setActiveCategory] = useState<ToolCategory>("All")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tools.filter((t) => {
      const categoryOk = activeCategory === "All" ? true : t.category === activeCategory
      const queryOk =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.href.toLowerCase().includes(q)
      return categoryOk && queryOk
    })
  }, [tools, activeCategory, query])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PageTransition>
        <main className="relative z-10 min-h-screen p-5 sm:p-6">
          <section className="mx-auto max-w-5xl">
            {/* Header */}
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                  Creative Tools <Sparkles className="w-6 h-6 text-white/70" />
                </h1>
                <p className="text-white/75">
                  Explore brushes, color science, and generators — all in one place.
                </p>
              </div>

              {/* Search */}
              <div className="w-full sm:w-[360px]">
                <div className="flex items-center gap-2 rounded-xl bg-white/7 ring-1 ring-white/15 px-3 py-2 backdrop-blur">
                  <Search className="w-4 h-4 text-white/60" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tools… (palette, brush, image, etc.)"
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/45"
                  />
                </div>
              </div>
            </motion.div>

            {/* Category Pills */}
            <motion.div
              className="flex flex-wrap gap-2 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.05 }}
            >
              <CategoryPill
                active={activeCategory === "All"}
                label="All"
                icon={<Layers className="w-4 h-4" />}
                onClick={() => setActiveCategory("All")}
              />
              <CategoryPill
                active={activeCategory === "Painting"}
                label="Painting"
                icon={<Paintbrush className="w-4 h-4" />}
                onClick={() => setActiveCategory("Painting")}
              />
              <CategoryPill
                active={activeCategory === "Color"}
                label="Color"
                icon={<Palette className="w-4 h-4" />}
                onClick={() => setActiveCategory("Color")}
              />
              <CategoryPill
                active={activeCategory === "Text"}
                label="Text"
                icon={<Type className="w-4 h-4" />}
                onClick={() => setActiveCategory("Text")}
              />
              <CategoryPill
                active={activeCategory === "Experimental"}
                label="Experimental"
                icon={<Brain className="w-4 h-4" />}
                onClick={() => setActiveCategory("Experimental")}
              />
            </motion.div>

            {/* Tools Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((t, idx) => (
                  <motion.div
                    key={t.href}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    <ToolLink
                      href={t.href}
                      icon={t.icon}
                      title={t.title}
                      description={t.description}
                      color={t.color}
                      glow={t.glow}
                      badge={t.badge}
                      delay={0.06 + idx * 0.03}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empty state */}
            {filtered.length === 0 ? (
              <div className="mt-10 text-center text-white/70">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/7 ring-1 ring-white/15 px-4 py-2">
                  <Search className="w-4 h-4" />
                  No tools found. Try a different search or category.
                </div>
              </div>
            ) : null}
          </section>
        </main>
      </PageTransition>
    </div>
  )
}
