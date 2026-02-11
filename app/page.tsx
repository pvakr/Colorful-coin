"use client"

import { motion } from "framer-motion"
import SpinningCoin from "@/components/SpinningCoin"
import ColorGrid from "@/components/ColorGrid"
import PageTransition from "@/components/PageTransition"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <main className="relative z-10 min-h-screen">
        {/* Content */}
        <PageTransition>
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <header className="text-center mb-20">
              <motion.h1
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-red-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6 drop-shadow-2xl"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Color Coin
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl text-white/90 font-medium drop-shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Spin the light. Feel the spectrum.
              </motion.p>
            </header>

            <section className="mb-24">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.25 }}
              >
                <SpinningCoin />
              </motion.div>
            </section>

            <ColorGrid />
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
