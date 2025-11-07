"use client"

import type React from "react"
import Link from "next/link"
import { motion } from "framer-motion"

// 1. UI Components (assuming these are defined elsewhere)
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// 2. Lucide Icons
import {
  ArrowLeft,
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
  // New icons for better differentiation
  Ruler, // For Analyzer/Tester
  Image, // For Image Extractor
  Brain, // For AI Mood Generator
  SprayCan, // For Realistic Paint Mixer
  Focus, // For Focus Color Spotlight
} from "lucide-react"

// --- Helper Component: ToolLink ---
/**
 * Renders a clickable card for a single tool with animation effects.
 */
function ToolLink({
  href,
  icon,
  title,
  description,
  color,
  delay,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  delay: number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.6, delay }}
    >
      <Link href={href}>
        <Card className="transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer border-2 hover:border-white/40 bg-white/10 backdrop-blur border-white/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <motion.div
                // The 'color' variable is used here to dynamically set the text color
                className={`${color} p-2 rounded-lg bg-white/20 backdrop-blur`} 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
              <div>
                <CardTitle className="text-lg text-white hover:text-white/80 transition-colors drop-shadow">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm text-white/70 drop-shadow">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  )
}

// --- Main Component: ToolsPage ---
export default function ToolsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <main className="relative z-10 min-h-screen p-6">
        <section className="mx-auto max-w-4xl">
          
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
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Creative Tools</h1>
              <p className="text-white/80 drop-shadow">Choose your digital painting adventure</p>
            </div>
          </motion.div>

          {/* Tools List */}
          <div className="grid gap-4">
            <ToolLink
              href="/tools/flow-field-brush"
              icon={<Waves className="w-6 h-6" />}
              title="Flow-Field Brush"
              description="Paint with dynamic flow fields controlled by Perlin noise"
              color="text-blue-400"
              delay={0.1}
            />

            <ToolLink
              href="/tools/palette-generator"
              icon={<Palette className="w-6 h-6" />}
              title="Palette Generator + Picker"
              description="Generate and manage harmonious color palettes"
              color="text-purple-400"
              delay={0.2}
            />

            <ToolLink
              href="/tools/symmetry-painter"
              icon={<Zap className="w-6 h-6" />}
              title="Symmetry & Tiling Painter"
              description="Create symmetric patterns with real-time mirroring"
              color="text-green-400"
              delay={0.3}
            />

            <ToolLink
              href="/tools/living-organism-brush"
              icon={<Sprout className="w-6 h-6" />}
              title="Living Organism Brush"
              description="Plant seeds that grow into organic fractal structures"
              color="text-orange-400"
              delay={0.4}
            />

            <ToolLink
              href="/tools/audio-reactive"
              icon={<Volume2 className="w-6 h-6" />}
              title="Audio-Reactive Painting"
              description="Let sound control your brush dynamics and colors"
              color="text-indigo-400"
              delay={0.5}
            />

            <ToolLink
              href="/tools/color-habit-tracker"
              icon={<CalendarCheck className="w-6 h-6" />}
              title="Color Habit Tracker"
              description="Track your daily creativity through color journaling"
              color="text-pink-400"
              delay={0.6}
            />

            <ToolLink
              href="/tools/light"
              icon={<Lightbulb className="w-6 h-6" />}
              title="Light Painter"
              description="Draw with glowing strokes of simulated neon light"
              color="text-yellow-400"
              delay={0.7}
            />

            <ToolLink
              href="/tools/match"
              icon={<Shuffle className="w-6 h-6" />}
              title="Color Match Maker"
              description="Find perfect color matches and complementary blends"
              color="text-teal-400"
              delay={0.8}
            />

            <ToolLink
              href="/tools/paint"
              icon={<Paintbrush className="w-6 h-6" />}
              title="Realistic Paint Simulator"
              description="Mix, smear, and blend digital paint like real oils"
              color="text-red-400"
              delay={0.9}
            />
            
            <ToolLink
              href="/tools/gradient-maker"
              icon={<Blend className="w-6 h-6" />}
              title="Gradient Maker"
              description="Generate linear and radial gradients, export CSS or images"
              color="text-red-400"
              delay={1.0}
            />

            <ToolLink
              href="/tools/text-styler"
              icon={<Type className="w-6 h-6" />}
              title="Text Styler"
              description="Style your text with colors, shadows, and gradient effects"
              color="text-blue-400"
              delay={1.1}
            />

            {/* Unique Color Tool 1: Picker */}
            <ToolLink
              href="/tools/color-picker-pro"
              icon={<Droplet className="w-6 h-6" />}
              title="Color Picker Pro"
              description="Pick colors, preview instantly, and copy HEX/RGB"
              color="text-green-400"
              delay={1.2}
            />

            {/* Unique Color Tool 2: Analyzer (Ruler/Structure) */}
            <ToolLink
              href="/tools/ColorHarmonyAnalyzer"
              icon={<Ruler className="w-6 h-6" />}
              title="Color Harmony Analyzer"
              description="Analyze color schemes for established harmonic rules"
              color="text-purple-400"
              delay={1.3}
            />
            
            {/* Unique Color Tool 3: Image Extractor (Image) */}
            <ToolLink
              href="/tools/ImageDominanceExtractor"
              icon={<Image className="w-6 h-6" />}
              title="Image Dominance Extractor"
              description="Extract the most dominant colors from any uploaded image"
              color="text-orange-400"
              delay={1.4}
            />

            {/* Unique Color Tool 4: AI Mood Generator (Brain/Thought) */}
            <ToolLink
              href="/tools/AIMoodPaletteGenerator"
              icon={<Brain className="w-6 h-6" />}
              title="AI Mood Palette Generator"
              description="Generate palettes based on text prompts and emotional keywords"
              color="text-indigo-400"
              delay={1.5}
            />

            {/* Unique Color Tool 5: Relativity Tester (Ruler/Measurement) */}
            <ToolLink
              href="/tools/ColorRelativityTester"
              icon={<Ruler className="w-6 h-6" />}
              title="Color Relativity Tester"
              description="See how surrounding colors affect a central color's appearance"
              color="text-pink-400"
              delay={1.6}
            />

            {/* Unique Color Tool 6: Realistic Mixer (SprayCan/Physicality) */}
            <ToolLink
              href="/tools/RealisticPaintMixer"
              icon={<SprayCan className="w-6 h-6" />}
              title="Realistic Paint Mixer"
              description="Virtually mix primary and secondary colors like physical paint"
              color="text-red-400"
              delay={1.7}
            />

            {/* Unique Color Tool 7: Focus Spotlight (Focus/Target) */}
            <ToolLink
              href="/tools/FocusColorSpotlight"
              icon={<Focus className="w-6 h-6" />}
              title="Focus Color Spotlight"
              description="Isolate and highlight a single color across an entire canvas"
              color="text-yellow-400"
              delay={1.8}
            />

          </div>
        </section>
      </main>
    </div>
  )
}