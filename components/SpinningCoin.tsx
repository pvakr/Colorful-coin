"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useState } from "react"
import ColorCoin from "./color-coin.png"

export default function SpinningCoin() {
  const shouldReduceMotion = useReducedMotion()
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 600)
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Glowing ring effect */}
      <div className="absolute inset-0 w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-yellow-400 via-red-400 via-blue-400 to-purple-400 opacity-30 blur-2xl animate-pulse" />

      <motion.div
        className="relative w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-4 focus:ring-white/50 z-10"
        tabIndex={0}
        role="button"
        aria-label="Continuously spinning Color Coin"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
        whileFocus={shouldReduceMotion ? {} : { scale: 1.05 }}
        animate={isClicked ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Coin image with continuous spin */}
        <motion.img
          src="/color-coin.png"
          alt="Colorful spinning coin with rainbow gradient"
          className="w-full h-full object-cover"
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={
            shouldReduceMotion
              ? {}
              : {
                  duration: 15,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }
          }
        />

        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          whileHover={{
            boxShadow: "0 0 60px rgba(255,255,255,0.8), inset 0 0 60px rgba(255,255,255,0.2)",
          }}
          whileFocus={{
            boxShadow: "0 0 60px rgba(255,255,255,0.8), inset 0 0 60px rgba(255,255,255,0.2)",
          }}
        />

        {/* Sparkle effect on click */}
        {isClicked && (
          <>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "100%", opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ transform: "skewX(-20deg)" }}
            />
            {/* Additional sparkles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 100,
                }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            ))}
          </>
        )}
      </motion.div>
    </div>
  )
}
