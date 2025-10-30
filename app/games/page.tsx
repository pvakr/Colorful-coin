"use client"

import type React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const games = [
  { title: "Color Arithmetic", slug: "color-arithmetic", description: "Solve puzzles using color-based math" },
  { title: "Color Rush", slug: "color-rush", description: "Fast-paced reaction game with shifting hues" },
  { title: "Color Memory", slug: "color-memory", description: "Test your memory with colorful sequences" },
  { title: "Color Count", slug: "color-count", description: "Count and match rapidly changing colors" },
  { title: "Color Command", slug: "color-command", description: "Follow tricky color-based commands" },
  { title: "Color Cleaner", slug: "color-cleaner", description: "Clear the board by matching colors" },
  { title: "Color Duplicator", slug: "color-duplicator", description: "Recreate color patterns quickly" },
  { title: "Color Catcher", slug: "color-catcher", description: "Catch falling colors before they fade" },
  { title: "Color Frequency", slug: "color-frequency", description: "Match rhythm and frequency with colors" },
  { title: "Color Flash", slug: "flash-colors", description: "Match rhythm and frequency with colors" },
  { title: "Color Match", slug: "quick-match", description: "Match rhythm and frequency with colors" },
  { title: "Color Sort", slug: "color-sort", description: "Match rhythm and frequency with colors" },
  
]

export default function GameHomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
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
              <GameLink key={g.slug} href={`/games/${g.slug}`} title={g.title} description={g.description} delay={i * 0.1} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }}>
      <Link href={href}>
        <Card className="transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer border-2 hover:border-white/40 bg-white/10 backdrop-blur border-white/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <motion.div
                className="text-[#FFED66] p-2 rounded-lg bg-white/20 backdrop-blur"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Gamepad2 className="w-6 h-6" />
              </motion.div>
              <div>
                <CardTitle className="text-lg text-white">{title}</CardTitle>
                <CardDescription className="text-sm text-white/70">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  )
}
