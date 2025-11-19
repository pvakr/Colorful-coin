"use client"

import type React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const games = [
  { title: "Color Cascade", slug: "color-cascade", description: "Tactical Match-3: Strategically place colored blocks to create chains of three or more, triggering spectacular cascades and massive score bonuses." },
  { title: "Color Drift Memory", slug: "color-driftmemory", description: "Spatial & Subtractive Challenge: Test your spatial memory and deep understanding of color mixing theory as hues subtly drift and blend on the grid." },
  { title: "Color Rush", slug: "color-rush", description: "High-Octane Reaction: A lightning-fast game where you must react instantly to shifting hues and flashing color prompts before the timer runs out." },
  { title: "Color Memory", slug: "color-memory", description: "Sequential Recall: Sharpen your short-term memory by perfectly recalling increasingly complex and lengthy sequences of flashing colors." },
  { title: "Color Match", slug: "quick-match", description: "Rhythm-Based Frequency: Match the rhythm and frequency of a pulsing beat by selecting the corresponding color to stay in sync." },
  { title: "Color DepthField", slug: "color-depth", description: "Layering & Blending Mastery: Move beyond simple matching into the complex world of transparency, blending modes, and stacking order to solve visual puzzles." },
  { title: "Color Command", slug: "color-command", description: "Tricky Cognitive Test: Follow a series of misleading and complex color-based commands that will challenge your focus and cognitive flexibility." },
  { title: "Color Duplicator", slug: "color-duplicator", description: "Pattern Replication Speed: Quickly and accurately recreate intricate color patterns under intense time pressure, testing your visual acuity and speed." },
  { title: "Color Frequency", slug: "color-frequency", description: "Synesthetic Synchronization: Match the vibrational frequency or rhythmic pulse of an element with the correct corresponding color." },
  { title: "Color Flash", slug: "flash-colors", description: "Instant Color Recognition: A quick-fire test of instant color recognition where you must select the correct hue before it vanishes in a flash." },
  { title: "Color Shadow", slug: "color-shadow", description: "Deep Visual Recall: Tests your ability to mentally reconstruct and recall the specific color of a shape, based only on its grayscale shadow." },
  { title: "Color Spectral", slug: "color-spectral", description: "Gradient Precision: A subtle challenge where you must find the single, slightly out-of-order tile within a long, continuous color gradient strip." },
  { title: "Color Synesthesia", slug: "color-synesthesia", description: "Sound/Emotion Mapping: Navigate a complex environment where sound and emotion are mapped directly to color, requiring you to react to non-visual cues." },
  { title: "Color Fusion Lab", slug: "color-fusionlab", description: "Digital Color Precision: Use sliders to precisely mix and challenge your understanding of digital color spaces (RGB) to match a target hue exactly." },
  { title: "Color Catcher", slug: "color-catcher", description: "Fading Hues Reflex: A fast-paced reflex game where you must \"catch\" falling blocks before their color fully fades to white or black." },
  { title: "Color Chromaticfilter", slug: "color-chromaticfilter", description: "Unique Hue Hunt: Find the single unique color among four nearly identical tiles, while a highly saturated, constantly shifting background tricks your eyes." },
  { title: "Color SpectrumFlashpoint", slug: "color-spectrumflashpoint", description: "Advanced Blending Puzzles: Combines challenges of blending, transparency, and stacking order in a fast-paced environment to solve complex color problems." },
  { title: "Color Spectral Echo", slug: "color-spectralecho", description: "RGB to CMY Translation: Translate your memory of light (RGB) into the required subtractive filters (CMY) under high-stakes, timed conditions." },
  { title: "Color Chroma Drift", slug: "color-chromadrift", description: "Simulated Vision Puzzle: A challenging puzzle game played entirely in an environment that simulates a specific type of color blindness, requiring a shift in perception." },
  { title: "Color Chroma Gauntlet", slug: "color-chroma", description: "Pigment Resource Strategy: A resource management and strategy game based on the economics and blending limits of real-world pigments (CMY/RYB)." },
  { title: "Color Cascade Puzzle", slug: "color-cascadepuzzle", description: "Advanced Theory Puzzle: A grid-based game that challenges your spatial awareness and deep understanding of color mixing theory with limited moves." },
  { title: "Color Arithmetic", slug: "color-arithmetic", description: "Solve Color Equations: Solve complex visual puzzles that are framed as mathematical equations using color values instead of numbers (e.g., Red + Blue = Magenta)." },
  { title: "Color Count", slug: "color-count", description: "Rapid Counting & Matching: Count and match rapidly changing and overlapping colors to meet a target quota before the screen becomes chaotic." },
  { title: "Color Cleaner", slug: "color-cleaner", description: "Board Clearing Strategy: Strategically match and eliminate colors to clear the entire board in the fewest moves possible." },
  { title: "Color Sort", slug: "color-sort", description: "Hue Spectrum Ordering: Quickly and accurately sort a jumbled set of colors back into the correct order along the visible light spectrum." },
  { title: "Color translator", slug: "color-translator", description: "Naming & Communication Test: A unique game focusing on color communication and naming conventions, requiring you to label or identify hues based on descriptive text." },
]

export default function GameHomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background decoration (optional, but good for visual style) */}
      <div className="absolute inset-0">
        {/* Subtle, abstract color pattern/gradient can go here */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255, 0, 150, 0.4) 0%, rgba(0, 200, 255, 0.4) 100%)',
        }}></div>
      </div>

      <main className="relative z-10 min-h-screen p-6">
        <section className="mx-auto max-w-5xl">
          {/* Header with back button */}
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">🎮 Color Games Arcade</h1>
              <p className="text-white/80 drop-shadow">Choose a game to begin your challenge</p>
            </div>
          </motion.div>

          {/* Game List */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g, i) => (
              <GameLink 
                key={g.slug} 
                href={`/games/${g.slug}`} 
                title={g.title} 
                description={g.description} 
                delay={i * 0.05} // Slightly reduced delay for faster load
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

interface GameLinkProps {
  href: string;
  title: string;
  description: string;
  delay: number;
}

function GameLink({
  href,
  title,
  description,
  delay,
}: GameLinkProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, delay }}
    >
      <Link href={href}>
        <Card className="transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer border-2 hover:border-[#FFED66] bg-white/10 backdrop-blur border-white/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <motion.div
                className="text-[#FFED66] p-3 rounded-xl bg-white/20 backdrop-blur shadow-inner"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Gamepad2 className="w-6 h-6" />
              </motion.div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
                <CardDescription className="text-sm text-white/70 mt-1">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  )
}