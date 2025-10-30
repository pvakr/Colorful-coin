"use client"

import { motion } from "framer-motion"
import SpinningCoin from "@/components/SpinningCoin"
import ColorGrid from "@/components/ColorGrid"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <main className="relative z-10 min-h-screen">
        {/* Nav */}
        <nav className="flex justify-center items-center py-6 px-6">
          <div className="flex gap-6">
            <Link href="/games" className="focus:outline-none">
              <motion.span
                className="px-8 py-3 inline-block rounded-full font-semibold text-white text-lg shadow-lg transition-all duration-300 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:via-purple-400 hover:to-indigo-400 hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Games
              </motion.span>
            </Link>

            <Link href="/tools" className="focus:outline-none">
              <motion.span
                className="px-8 py-3 inline-block rounded-full font-semibold text-white text-lg shadow-lg transition-all duration-300 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-400 hover:via-red-400 hover:to-pink-400 hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                Tools
              </motion.span>
            </Link>

            <Link href="/coloring" className="focus:outline-none">
              <motion.span
                className="px-8 py-3 inline-block rounded-full font-semibold text-white text-lg shadow-lg transition-all duration-300 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Coloring
              </motion.span>
            </Link>
          </div>
        </nav>

        {/* Content */}
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
      </main>
    </div>
  )
}
