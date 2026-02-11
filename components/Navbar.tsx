"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gamepad2,
  Palette,
  PenTool,
  Trophy,
  ShoppingBag,
  Home,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Navigation items configuration
const navItems = [
  { href: "/", label: "Home", icon: Home, description: "Return to main page" },
  { href: "/games", label: "Games", icon: Gamepad2, description: "Play color games" },
  { href: "/tools", label: "Tools", icon: Palette, description: "Color utilities" },
  { href: "/coloring", label: "Coloring", icon: PenTool, description: "Digital coloring" },
  { href: "/artchallenge", label: "Art Challenge", icon: Trophy, description: "Test your skills" },
  { href: "/store", label: "Store", icon: ShoppingBag, description: "Shop products" },
]

// Dropdown items for Games
const gamesCategories = [
  { href: "/games", label: "All Games", description: "View all games" },
  { href: "/games?category=puzzle", label: "Puzzle", description: "Solve color puzzles" },
  { href: "/games?category=memory", label: "Memory", description: "Test your memory" },
  { href: "/games?category=reflex", label: "Reflex", description: "Fast-paced action" },
  { href: "/games?category=strategy", label: "Strategy", description: "Strategic thinking" },
]

// Dropdown items for Tools
const toolsCategories = [
  { href: "/tools", label: "All Tools", description: "View all tools" },
  { href: "/tools?category=painting", label: "Painting", description: "Creative brushes" },
  { href: "/tools?category=color", label: "Color", description: "Color utilities" },
  { href: "/tools?category=text", label: "Text", description: "Text styling" },
  { href: "/tools?category=experimental", label: "Experimental", description: "Beta features" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const handleMouseEnter = (href: string) => {
    if (href === "/games" || href === "/tools") {
      setActiveDropdown(href)
    }
  }

  const handleMouseLeave = () => {
    setActiveDropdown(null)
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-xl border-b border-white/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white hidden sm:block group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:via-orange-500 group-hover:to-red-500 group-hover:bg-clip-text group-hover:text-transparent transition-all">
              Color Coin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.href)}
                onMouseLeave={handleMouseLeave}
              >
                <Link href={item.href}>
                  <motion.span
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive(item.href)
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {(item.href === "/games" || item.href === "/tools") && (
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform",
                          activeDropdown === item.href ? "rotate-180" : ""
                        )}
                      />
                    )}
                  </motion.span>
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {activeDropdown === item.href && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden"
                    >
                      <div className="py-2">
                        {(item.href === "/games" ? gamesCategories : toolsCategories).map(
                          (category, index) => (
                            <Link
                              key={category.href}
                              href={category.href}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                              {category.label}
                            </Link>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all",
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs text-white/50">{item.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
