"use client"

import { ReactNode, isValidElement, createElement, type ReactElement } from "react"
import { motion } from "framer-motion"
import { Sparkles, LucideIcon } from "lucide-react"
import Link from "next/link"

interface GameStat {
  label: string
  value: string | number
  icon?: ReactNode | LucideIcon
}

interface GameWrapperProps {
  title: string
  description?: string
  children: ReactNode
  showBackButton?: boolean
  backUrl?: string
  stats?: GameStat[]
}

export default function GameWrapper({
  title,
  description,
  children,
  showBackButton = false,
  backUrl = "/games",
  stats = [],
}: GameWrapperProps) {
  // Helper to render icon properly
  const renderIcon = (icon: ReactNode | LucideIcon | undefined) => {
    if (!icon) return null
    
    // If it's a React element (JSX), render it as-is
    if (isValidElement(icon)) {
      return icon
    }
    
    // If it's a LucideIcon component, render it with className
    if (typeof icon === "function" || typeof icon === "object") {
      const IconComponent = icon as React.ComponentType<{ className?: string }>
      return <IconComponent className="w-4 h-4 text-white/70" />
    }
    
    return null
  }

  return (
    <div className="relative min-h-screen">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <div className="relative z-10 min-h-screen p-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link href={backUrl}>
                <motion.span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ← Back
                </motion.span>
              </Link>
            )}

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                {title}
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </h1>
              {description && (
                <p className="text-white/70 mt-1">{description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex items-center gap-3">
              {stats.map((stat, index) => {
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20"
                  >
                    {renderIcon(stat.icon)}
                    <div>
                      <p className="text-xs text-white/50">{stat.label}</p>
                      <p className="text-white font-semibold">{stat.value}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Game Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
