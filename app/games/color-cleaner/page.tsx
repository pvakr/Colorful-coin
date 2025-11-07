"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
    <main className="min-h-screen px-4 py-12">
      {/* Back button - simplified */}
      <div className="fixed top-6 left-6">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent hover:bg-transparent border px-3"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <section className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Fading Color Cleaner</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Score</span>
              <span className="font-semibold">{score}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
              <span>Lives</span>
              <span className="font-semibold">{lives}</span>
            </span>
          </div>
        </div>

        {!gameOver && (
          <p className="mt-4 text-center text-base sm:text-lg">Tap the colored blobs before they fade away.</p>
        )}

        <div className="mt-6 relative w-full h-[500px] mx-auto bg-gray-800 rounded border-2 border-white overflow-hidden">
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

        <Dialog open={gameOver}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Game Over</DialogTitle>
              <DialogDescription>
                Your score: <span className="font-semibold">{score}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>Back to Games</Button>
              <Button onClick={resetGame}>Restart</Button>
            </div>
          </DialogContent>
        </Dialog>

        <style jsx global>{`
          @keyframes fadeout {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `}</style>
      </section>
    </main>
  )
}
