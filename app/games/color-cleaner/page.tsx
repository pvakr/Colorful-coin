"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const COLORS = ["red", "blue", "green", "yellow", "purple"]
const MAX_LIVES = 3
const SPAWN_INTERVAL = 1000
const FADE_DURATION = 3000

type Blob = {
  id: number
  color: string
  x: number
  y: number
  createdAt: number
}

export default function FadingColorCleaner() {
  const router = useRouter() // ✅ router defined here

  const [blobs, setBlobs] = useState<Blob[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    if (gameOver) return

    const spawn = setInterval(() => {
      const newBlob: Blob = {
        id: Date.now(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        x: Math.random() * 90,
        y: Math.random() * 60 + 20,
        createdAt: Date.now(),
      }
      setBlobs((prev) => [...prev, newBlob])
    }, SPAWN_INTERVAL)

    return () => clearInterval(spawn)
  }, [gameOver])

  useEffect(() => {
    const check = setInterval(() => {
      const now = Date.now()
      setBlobs((prev) => {
        const stillVisible: Blob[] = []
        let missed = 0

        for (const blob of prev) {
          if (now - blob.createdAt > FADE_DURATION) {
            if (blob.color === "red") {
              missed++
            }
          } else {
            stillVisible.push(blob)
          }
        }

        if (missed > 0) {
          setLives((l) => {
            const newLives = l - missed
            if (newLives <= 0) setGameOver(true)
            return newLives
          })
        }

        return stillVisible
      })
    }, 500)

    return () => clearInterval(check)
  }, [])

  const handleClick = (id: number) => {
    setBlobs((prev) => prev.filter((b) => b.id !== id))
    setScore((s) => s + 1)
  }

  const getBg = (color: string) =>
    ({
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-300",
      purple: "bg-purple-500",
    }[color])

  const resetGame = () => {
    setScore(0)
    setLives(MAX_LIVES)
    setBlobs([])
    setGameOver(false)
  }

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to games
  }

  return (
    <main className="min-h-screen p-6">
      {/* Back Button at top-30 left-50 */}
      <div className="fixed top-30 left-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 border border-yellow text-black"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
        <h1 className="text-4xl font-bold mb-2 text-[#FF6C00] drop-shadow">🧼 Fading Color Cleaner</h1>
        <p className="mb-1 text-green-300 text-lg">Score: {score}</p>
        <p className="mb-4 text-red-400 text-sm">Lives: {lives}</p>

        {!gameOver ? (
          <div className="relative w-full h-[500px] bg-gray-800 rounded border-2 border-white overflow-hidden">
            {blobs.map((blob) => (
              <button
                key={blob.id}
                onClick={() => handleClick(blob.id)}
                className={`absolute w-12 h-12 rounded-full ${getBg(blob.color)} transition-opacity`}
                style={{
                  top: `${blob.y}%`,
                  left: `${blob.x}%`,
                  opacity: 1,
                  animation: `fadeout ${FADE_DURATION}ms forwards`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center mt-6">
            <p className="text-2xl text-yellow-300 mb-4">💀 Game Over</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 font-semibold"
            >
              🔁 Restart
            </button>
          </div>
        )}

        <style jsx global>{`
          @keyframes fadeout {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
        `}</style>
      </section>
    </main>
  )
}
