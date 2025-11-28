"use client"

import type React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const games = [
  { 
    title: "Color Cascade", 
    slug: "color-cascade", 
    description: "Tactical Match-3: Strategically connect three or more colored tiles to trigger spectacular chain reactions and massive score bonuses." 
  },
  { 
    title: "Color Orbit", 
    slug: "color-orbit", 
    description: "Circular Logic Puzzle: Rotate orbiting color rings to align and match incoming colored projectiles before they collide with the core." 
  },
  { 
    title: "Color Drift Memory", 
    slug: "color-driftmemory", 
    description: "Spatial & Subtractive Challenge: Memorize a pattern, then recreate it as the hues subtly drift and blend across the grid, testing your memory and color theory." 
  },
  { 
    title: "Color Conflict", 
    slug: "color-conflict", 
    description: "Strategic Area Control: Use color resources to claim territory and defend against opposing hues in a turn-based strategy game." 
  },
  { 
    title: "Color Camouflage", 
    slug: "color-camouflage", 
    description: "Perception & Stealth: Locate a target object whose color perfectly blends with a constantly shifting, complex background pattern." 
  },
  { 
    title: "Color Negative", 
    slug: "color-negative", 
    description: "Inversion Puzzle: Solve visual puzzles by mentally flipping colors to their exact inverse (negative) to match the target pattern." 
  },
  { 
    title: "Color Palette Thief", 
    slug: "color-palettethief", 
    description: "Stealth & Resource Management: Steal specific color swatches from a guarded palette without triggering an alarm or running out of time." 
  },
  { 
    title: "Color Hex Breaker", 
    slug: "color-hex", 
    description: "Geometric Match-3: A fast-paced puzzle game on a hexagonal grid, requiring strategic matching and awareness of radiating color connections." 
  },
  { 
    title: "Color Bubble Shooter", 
    slug: "color-bubbleshooter", 
    description: "Precision Aiming: Launch colored bubbles to create groups of three or more, clearing the ceiling before it descends." 
  },
  { 
    title: "Color Rush", 
    slug: "color-rush", 
    description: "High-Octane Reaction: Select the correct color based on a rapid-fire visual or text prompt before the time bar empties." 
  },
  { 
    title: "Color Memory", 
    slug: "color-memory", 
    description: "Sequential Recall: Sharpen your short-term memory by perfectly recalling increasingly complex and lengthy sequences of flashing colors." 
  },
  { 
    title: "Color Match", 
    slug: "quick-match", 
    description: "Speed Recognition: Instantly match the central color to one of the surrounding options under intense time pressure." 
  },
  { 
    title: "Color DepthField", 
    slug: "color-depth", 
    description: "Layering & Blending Mastery: Arrange semi-transparent color layers to perfectly replicate a target blended hue, mastering digital color depth." 
  },
  { 
    title: "Color Command", 
    slug: "color-command", 
    description: "Tricky Cognitive Test: Follow a series of misleading commands where the color word and the color of the word itself often conflict (Stroop effect challenge)." 
  },
  { 
    title: "Color Duplicator", 
    slug: "color-duplicator", 
    description: "Pattern Replication Speed: Quickly and accurately recreate intricate color patterns on a secondary grid under time pressure." 
  },
  { 
    title: "Color Frequency", 
    slug: "color-frequency", 
    description: "Synesthetic Synchronization: Associate and match the rhythmic pulse or vibrational frequency of an element with the correct corresponding color on the spectrum." 
  },
  { 
    title: "Color Flash", 
    slug: "flash-colors", 
    description: "Instant Color Recognition: A quick-fire test of instant color recognition where you must identify and select the correct hue before it vanishes in a flash." 
  },
  { 
    title: "Color Shadow", 
    slug: "color-shadow", 
    description: "Deep Visual Recall: Tests your ability to mentally reconstruct and recall the specific original color of a shape, based only on its grayscale shadow." 
  },
  { 
    title: "Color Spectral", 
    slug: "color-spectral", 
    description: "Gradient Precision: A subtle challenge where you must find the single, slightly out-of-order tile within a long, continuous color gradient strip." 
  },
  { 
    title: "Color Synesthesia", 
    slug: "color-synesthesia", 
    description: "Sound/Emotion Mapping: Match non-visual cues (like musical tones or emotional text) to their correctly mapped color to solve the puzzle." 
  },
  { 
    title: "Color Fusion Lab", 
    slug: "color-fusionlab", 
    description: "Digital Color Precision: Use sliders to precisely mix and challenge your understanding of digital color spaces (RGB) to match a target hue exactly." 
  },
  { 
    title: "Color Catcher", 
    slug: "color-catcher", 
    description: "Fading Hues Reflex: A fast-paced reflex game where you must 'catch' falling blocks before their color fully fades to white or black." 
  },
  { 
    title: "Color Chromaticfilter", 
    slug: "color-chromaticfilter", 
    description: "Unique Hue Hunt: Find the single unique color among many nearly identical tiles, while a highly saturated, constantly shifting filter tricks your eyes." 
  },
  { 
    title: "Color SpectrumFlashpoint", 
    slug: "color-spectrumflashpoint", 
    description: "Advanced Blending Puzzles: Combines challenges of blending, transparency, and stacking order in a fast-paced environment to solve complex color problems." 
  },
  { 
    title: "Color Spectral Echo", 
    slug: "color-spectralecho", 
    description: "RGB to CMY Translation: Translate your memory of additive light (RGB) into the required subtractive filter values (CMY) under timed conditions." 
  },
  { 
    title: "Color Chroma Drift", 
    slug: "color-chromadrift", 
    description: "Simulated Vision Puzzle: A challenging puzzle game played entirely in an environment that simulates a specific type of color blindness, requiring a shift in perception." 
  },
  { 
    title: "Color Chroma Gauntlet", 
    slug: "color-chroma", 
    description: "Pigment Resource Strategy: A resource management and strategy game based on the economics and blending limits of real-world pigments (CMY/RYB)." 
  },
  { 
    title: "Color Cascade Puzzle", 
    slug: "color-cascadepuzzle", 
    description: "Advanced Theory Puzzle: A grid-based game that challenges your spatial awareness and deep understanding of color mixing theory with limited moves." 
  },
  { 
    title: "Color Arithmetic", 
    slug: "color-arithmetic", 
    description: "Solve Color Equations: Solve complex visual puzzles framed as mathematical equations using color values instead of numbers (e.g., Red + Blue = Magenta)." 
  },
  { 
    title: "Color Count", 
    slug: "color-count", 
    description: "Rapid Counting & Matching: Count and match rapidly changing and overlapping colors to meet a target quota before the screen becomes chaotic." 
  },
  { 
    title: "Color Cleaner", 
    slug: "color-cleaner", 
    description: "Board Clearing Strategy: Strategically match and eliminate colors to clear the entire board in the fewest moves possible." 
  },
  { 
    title: "Color Sort", 
    slug: "color-sort", 
    description: "Hue Spectrum Ordering: Quickly and accurately sort a jumbled set of colors back into the correct order along the visible light spectrum." 
  },
  { 
    title: "Color translator", 
    slug: "color-translator", 
    description: "Naming & Communication Test: Identify the exact hue based on descriptive text (e.g., 'seafoam green' or 'electric crimson'), testing color vocabulary." 
  },
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