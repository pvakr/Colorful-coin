import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import AnimatedBackground from "@/components/AnimatedBackground"
import Navbar from "@/components/Navbar"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Color Coin",
  description: "Spin the light. Feel the spectrum.",
  generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-transparent antialiased">
        {/* Background lives once at the root */}
        <AnimatedBackground />

        {/* Navbar - fixed at top */}
        <Navbar />

        {/* Foreground container with padding for fixed navbar */}
        <div className="relative z-10 min-h-screen pt-16">
          {children}
        </div>

        {/* Toast notifications */}
        <Toaster />
      </body>
    </html>
  )
}
