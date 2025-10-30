"use client"

import { MeshGradient } from "@paper-design/shaders-react"

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <MeshGradient
        className="w-full h-full"
        colors={[
          "#FF6B6B", // Coral red
          "#4ECDC4", // Turquoise
          "#45B7D1", // Sky blue
          "#96CEB4", // Mint green
          "#FFEAA7", // Warm yellow
          "#DDA0DD", // Plum
          "#98D8C8", // Seafoam
          "#F7DC6F", // Golden yellow
        ]}
        speed={0.02}
        distortion={0.42}
        swirl={0.18}
        style={{ filter: "blur(0.5px) saturate(1.2) contrast(1.1)" }}
      />
      {/* Soft paint-like overlays */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(255, 107, 107, 0.35) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(78, 205, 196, 0.35) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(150, 206, 180, 0.35) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(221, 160, 221, 0.35) 0%, transparent 50%)
          `,
          animation: "paintFlow 20s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes paintFlow {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
          25% { transform: scale(1.1) rotate(90deg); opacity: 0.4; }
          50% { transform: scale(0.9) rotate(180deg); opacity: 0.2; }
          75% { transform: scale(1.05) rotate(270deg); opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
