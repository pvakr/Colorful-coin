import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import AnimatedBackground from "@/components/AnimatedBackground"

export const metadata: Metadata = {
  title: "Colorful Coin",
  description: "Spin the light. Feel the spectrum.",
  icons: {
    icon: "/color-coin.png",       // browser tab favicon
    shortcut: "/color-coin.png",
    apple: "/color-coin.png",      // for iOS Safari homescreen
  },
  openGraph: {
    title: "Colorful Coin",
    description: "Spin the light. Feel the spectrum.",
    images: ["/color-coin.png"],   // when shared on social media
  },
  twitter: {
    card: "summary_large_image",
    title: "Colorful Coin",
    description: "Spin the light. Feel the spectrum.",
    images: ["/color-coin.png"],
  },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-transparent antialiased">
        {/* Background lives once at the root */}
        <AnimatedBackground />

        {/* Foreground container */}
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  )
}
