"use client"

import type React from "react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Gamepad2,
  Search,
  Sparkles,
  Layers,
  Puzzle,
  Brain,
  Zap,
  Shield,
} from "lucide-react"
import PageTransition from "@/components/PageTransition"

type GameCategory = "All" | "Puzzle" | "Memory" | "Reflex" | "Strategy"

type GameItem = {
  title: string
  slug: string
  description: string
  category: Exclude<GameCategory, "All">
}

const games: GameItem[] = [
  {
    title: "Color Cascade",
    slug: "color-cascade",
    description:
      "Tactical Match-3: Strategically connect three or more colored tiles to trigger spectacular chain reactions and massive score bonuses.",
    category: "Puzzle",
  },
  {
    title: "Color Orbit",
    slug: "color-orbit",
    description:
      "Circular Logic Puzzle: Rotate orbiting color rings to align and match incoming colored projectiles before they collide with the core.",
    category: "Puzzle",
  },
  {
    title: "Color Drift Memory",
    slug: "color-driftmemory",
    description:
      "Spatial & Subtractive Challenge: Memorize a pattern, then recreate it as the hues subtly drift and blend across the grid, testing your memory and color theory.",
    category: "Memory",
  },
  {
    title: "Color Conflict",
    slug: "color-conflict",
    description:
      "Strategic Area Control: Use color resources to claim territory and defend against opposing hues in a turn-based strategy game.",
    category: "Strategy",
  },
  {
    title: "Color Camouflage",
    slug: "color-camouflage",
    description:
      "Perception & Stealth: Locate a target object whose color perfectly blends with a constantly shifting, complex background pattern.",
    category: "Reflex",
  },
  {
    title: "Color Negative",
    slug: "color-negative",
    description:
      "Inversion Puzzle: Solve visual puzzles by mentally flipping colors to their exact inverse (negative) to match the target pattern.",
    category: "Puzzle",
  },
  {
    title: "Color Palette Thief",
    slug: "color-palettethief",
    description:
      "Stealth & Resource Management: Steal specific color swatches from a guarded palette without triggering an alarm or running out of time.",
    category: "Strategy",
  },
  {
    title: "Color Hex Breaker",
    slug: "color-hex",
    description:
      "Geometric Match-3: A fast-paced puzzle game on a hexagonal grid, requiring strategic matching and awareness of radiating color connections.",
    category: "Puzzle",
  },
  {
    title: "Color Bubble Shooter",
    slug: "color-bubbleshooter",
    description:
      "Precision Aiming: Launch colored bubbles to create groups of three or more, clearing the ceiling before it descends.",
    category: "Reflex",
  },
  {
    title: "Color Rush",
    slug: "color-rush",
    description:
      "High-Octane Reaction: Select the correct color based on a rapid-fire visual or text prompt before the time bar empties.",
    category: "Reflex",
  },
  {
    title: "Color Memory",
    slug: "color-memory",
    description:
      "Sequential Recall: Sharpen your short-term memory by perfectly recalling increasingly complex and lengthy sequences of flashing colors.",
    category: "Memory",
  },
  {
    title: "Color Match",
    slug: "quick-match",
    description:
      "Speed Recognition: Instantly match the central color to one of the surrounding options under intense time pressure.",
    category: "Reflex",
  },
  {
    title: "Color DepthField",
    slug: "color-depth",
    description:
      "Layering & Blending Mastery: Arrange semi-transparent color layers to perfectly replicate a target blended hue, mastering digital color depth.",
    category: "Puzzle",
  },
  {
    title: "Color Command",
    slug: "color-command",
    description:
      "Tricky Cognitive Test: Follow a series of misleading commands where the color word and the color of the word itself often conflict (Stroop effect challenge).",
    category: "Memory",
  },
  {
    title: "Color Duplicator",
    slug: "color-duplicator",
    description:
      "Pattern Replication Speed: Quickly and accurately recreate intricate color patterns on a secondary grid under time pressure.",
    category: "Reflex",
  },
  {
    title: "Color Frequency",
    slug: "color-frequency",
    description:
      "Synesthetic Synchronization: Associate and match the rhythmic pulse or vibrational frequency of an element with the correct corresponding color on the spectrum.",
    category: "Memory",
  },
  {
    title: "Color Flash",
    slug: "flash-colors",
    description:
      "Instant Color Recognition: A quick-fire test of instant color recognition where you must identify and select the correct hue before it vanishes in a flash.",
    category: "Reflex",
  },
  {
    title: "Color Shadow",
    slug: "color-shadow",
    description:
      "Deep Visual Recall: Tests your ability to mentally reconstruct and recall the specific original color of a shape, based only on its grayscale shadow.",
    category: "Memory",
  },
  {
    title: "Color Spectral",
    slug: "color-spectral",
    description:
      "Gradient Precision: A subtle challenge where you must find the single, slightly out-of-order tile within a long, continuous color gradient strip.",
    category: "Puzzle",
  },
  {
    title: "Color Synesthesia",
    slug: "color-synesthesia",
    description:
      "Sound/Emotion Mapping: Match non-visual cues (like musical tones or emotional text) to their correctly mapped color to solve the puzzle.",
    category: "Memory",
  },
  {
    title: "Color Fusion Lab",
    slug: "color-fusionlab",
    description:
      "Digital Color Precision: Use sliders to precisely mix and challenge your understanding of digital color spaces (RGB) to match a target hue exactly.",
    category: "Puzzle",
  },
  {
    title: "Color Catcher",
    slug: "color-catcher",
    description:
      "Fading Hues Reflex: A fast-paced reflex game where you must 'catch' falling blocks before their color fully fades to white or black.",
    category: "Reflex",
  },
  {
    title: "Color Chromaticfilter",
    slug: "color-chromaticfilter",
    description:
      "Unique Hue Hunt: Find the single unique color among many nearly identical tiles, while a highly saturated, constantly shifting filter tricks your eyes.",
    category: "Puzzle",
  },
  {
    title: "Color SpectrumFlashpoint",
    slug: "color-spectrumflashpoint",
    description:
      "Advanced Blending Puzzles: Combines challenges of blending, transparency, and stacking order in a fast-paced environment to solve complex color problems.",
    category: "Puzzle",
  },
  {
    title: "Color Spectral Echo",
    slug: "color-spectralecho",
    description:
      "RGB to CMY Translation: Translate your memory of additive light (RGB) into the required subtractive filter values (CMY) under timed conditions.",
    category: "Memory",
  },
  {
    title: "Color Chroma Drift",
    slug: "color-chromadrift",
    description:
      "Simulated Vision Puzzle: A challenging puzzle game played entirely in an environment that simulates a specific type of color blindness, requiring a shift in perception.",
    category: "Puzzle",
  },
  {
    title: "Color Chroma Gauntlet",
    slug: "color-chroma",
    description:
      "Pigment Resource Strategy: A resource management and strategy game based on the economics and blending limits of real-world pigments (CMY/RYB).",
    category: "Strategy",
  },
  {
    title: "Color Cascade Puzzle",
    slug: "color-cascadepuzzle",
    description:
      "Advanced Theory Puzzle: A grid-based game that challenges your spatial awareness and deep understanding of color mixing theory with limited moves.",
    category: "Puzzle",
  },
  {
    title: "Color Arithmetic",
    slug: "color-arithmetic",
    description:
      "Solve Color Equations: Solve complex visual puzzles framed as mathematical equations using color values instead of numbers (e.g., Red + Blue = Magenta).",
    category: "Puzzle",
  },
  {
    title: "Color Count",
    slug: "color-count",
    description:
      "Rapid Counting & Matching: Count and match rapidly changing and overlapping colors to meet a target quota before the screen becomes chaotic.",
    category: "Reflex",
  },
  {
    title: "Color Cleaner",
    slug: "color-cleaner",
    description:
      "Board Clearing Strategy: Strategically match and eliminate colors to clear the entire board in the fewest moves possible.",
    category: "Puzzle",
  },
  {
    title: "Color Sort",
    slug: "color-sort",
    description:
      "Hue Spectrum Ordering: Quickly and accurately sort a jumbled set of colors back into the correct order along the visible light spectrum.",
    category: "Puzzle",
  },
  {
    title: "Color translator",
    slug: "color-translator",
    description:
      "Naming & Communication Test: Identify the exact hue based on descriptive text (e.g., 'seafoam green' or 'electric crimson'), testing color vocabulary.",
    category: "Memory",
  },
]

// --- Category pill ---
function CategoryPill({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: GameCategory
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

// --- Game Card ---
function GameLink({
  href,
  title,
  description,
  delay,
}: {
  href: string
  title: string
  description: string
  delay: number
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
              "hover:shadow-2xl hover:shadow-yellow-500/10",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
            </div>

            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/10 blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-300" />

            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <motion.div
                  className={[
                    "shrink-0 rounded-xl p-2.5",
                    "bg-white/10 ring-1 ring-white/15",
                    "backdrop-blur",
                    "text-[#FFED66]",
                  ].join(" ")}
                  whileHover={{ rotate: -6, scale: 1.05 }}
                  transition={{ duration: 0.18 }}
                >
                  <Gamepad2 className="w-6 h-6" />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg text-white drop-shadow">
                    {title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-white/70 leading-snug">
                    {description}
                  </CardDescription>
                </div>

                <div className="ml-auto mt-1 text-white/40 group-hover:text-white/70 transition-colors">
                  ✨
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

export default function GameHomePage() {
  const categories: GameCategory[] = ["All", "Puzzle", "Memory", "Reflex", "Strategy"]
  const [activeCategory, setActiveCategory] = useState<GameCategory>("All")
  const [query, setQuery] = useState<string>("")

  const filteredGames = useMemo<GameItem[]>(() => {
    const q = query.trim().toLowerCase()
    return games.filter((g) => {
      const categoryOk = activeCategory === "All" ? true : g.category === activeCategory
      const queryOk =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q)
      return categoryOk && queryOk
    })
  }, [activeCategory, query])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PageTransition>
        <main className="relative z-10 min-h-screen p-6">
          <section className="mx-auto max-w-5xl">
            {/* Header + Search */}
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                  🎮 Color Games Arcade <Sparkles className="w-6 h-6 text-white/70" />
                </h1>
                <p className="text-white/80 drop-shadow">
                  Choose a game to begin your challenge
                </p>
              </div>

              <div className="w-full sm:w-[360px]">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/20 px-3 py-2 backdrop-blur">
                  <Search className="w-4 h-4 text-white/60" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search games… (memory, match, puzzle, etc.)"
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
                active={activeCategory === "Puzzle"}
                label="Puzzle"
                icon={<Puzzle className="w-4 h-4" />}
                onClick={() => setActiveCategory("Puzzle")}
              />
              <CategoryPill
                active={activeCategory === "Memory"}
                label="Memory"
                icon={<Brain className="w-4 h-4" />}
                onClick={() => setActiveCategory("Memory")}
              />
              <CategoryPill
                active={activeCategory === "Reflex"}
                label="Reflex"
                icon={<Zap className="w-4 h-4" />}
                onClick={() => setActiveCategory("Reflex")}
              />
              <CategoryPill
                active={activeCategory === "Strategy"}
                label="Strategy"
                icon={<Shield className="w-4 h-4" />}
                onClick={() => setActiveCategory("Strategy")}
              />
            </motion.div>

            {/* Game Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredGames.map((g: GameItem, i: number) => (
                  <motion.div
                    key={g.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    <GameLink
                      href={`/games/${g.slug}`}
                      title={g.title}
                      description={g.description}
                      delay={0.03 + i * 0.02}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empty state */}
            {filteredGames.length === 0 ? (
              <div className="mt-10 text-center text-white/70">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/7 ring-1 ring-white/15 px-4 py-2">
                  <Search className="w-4 h-4" />
                  No games found. Try a different search or category.
                </div>
              </div>
            ) : null}
          </section>
        </main>
      </PageTransition>
    </div>
  )
}
