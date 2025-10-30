"use client"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import "../../globals.css"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const FIXED_COLOR = "#FF6C00"
const CONTAINER_WIDTH = 600
const CONTAINER_HEIGHT = 700
const BALL_SIZE = 24
const PLAYER_SIZE = 48
const BULLET_SIZE = 8
const BULLET_SPEED = 20
const BOTTOM_MARGIN = 16
const MOVE_STEP = 20
const DROP_INTERVAL = 1000
const FALL_INTERVAL = 100
const BULLET_INTERVAL = 50

type Ball = { id: number; color: string; x: number; y: number }
type Bullet = { id: number; x: number; y: number }

export default function ColorCatcher() {
  const router = useRouter()
  const [balls, setBalls] = useState<Ball[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [playerX, setPlayerX] = useState((CONTAINER_WIDTH - PLAYER_SIZE) / 2)
  const [score, setScore] = useState(0)

  const playerXRef = useRef(playerX)
  const ballsRef = useRef<Ball[]>(balls)

  useEffect(() => {
    playerXRef.current = playerX
  }, [playerX])
  useEffect(() => {
    ballsRef.current = balls
  }, [balls])

  useEffect(() => {
    const dropId = setInterval(() => {
      setBalls((prev) => [
        ...prev,
        { id: Date.now(), color: FIXED_COLOR, x: Math.random() * (CONTAINER_WIDTH - BALL_SIZE), y: 0 },
      ])
    }, DROP_INTERVAL)

    const fallId = setInterval(() => {
      setBalls(
        (prev) =>
          prev
            .map((ball) => ({ ...ball, y: ball.y + CONTAINER_HEIGHT / 70 }))
            .filter((ball) => ball.y < CONTAINER_HEIGHT) as Ball[],
      )
    }, FALL_INTERVAL)

    return () => {
      clearInterval(dropId)
      clearInterval(fallId)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setBullets((prevBullets) => {
        let hits = 0
        const kept: Bullet[] = []
        const remainingBalls = [...ballsRef.current]

        prevBullets.forEach((b) => {
          const newY = b.y - BULLET_SPEED
          if (newY < 0) return

          const idx = remainingBalls.findIndex((ball) => {
            const dx = b.x + BULLET_SIZE / 2 - (ball.x + BALL_SIZE / 2)
            const dy = newY - (ball.y + BALL_SIZE / 2)
            return Math.hypot(dx, dy) < (BALL_SIZE + BULLET_SIZE) / 2
          })

          if (idx >= 0) {
            remainingBalls.splice(idx, 1)
            hits++
          } else {
            kept.push({ ...b, y: newY })
          }
        })

        if (hits) {
          setScore((s) => s + hits)
          setBalls(remainingBalls)
        }
        return kept
      })
    }, BULLET_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setPlayerX((x) => Math.max(0, x - MOVE_STEP))
    } else if (e.key === "ArrowRight") {
      setPlayerX((x) => Math.min(CONTAINER_WIDTH - PLAYER_SIZE, x + MOVE_STEP))
    } else if (e.key === " ") {
      const bx = playerXRef.current + PLAYER_SIZE / 2 - BULLET_SIZE / 2
      const by = CONTAINER_HEIGHT - BOTTOM_MARGIN - PLAYER_SIZE - BULLET_SIZE
      setBullets((b) => [...b, { id: Date.now(), x: bx, y: by }])
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const handleBack = () => {
    router.push("/games") // Navigate to /games
  }

  return (
    <div>
      {/* Back Button positioned at top-30 left-50 */}
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

      <main className="min-h-screen flex flex-col items-center justify-center text-center ">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
          <h2 className="text-5xl font-bold mb-4 text-[#FF6C00]">Color Catcher</h2>
          <p className="mb-2 text-red text-center">Score: {score}</p>

          <div
            className="relative bg-[#1F1B3A] overflow-hidden border-4 border-white"
            style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}
          >
            {balls.map((b) => (
              <motion.div
                key={b.id}
                className="absolute rounded-full"
                style={{ width: BALL_SIZE, height: BALL_SIZE, backgroundColor: b.color, left: b.x, top: b.y }}
                animate={{ top: b.y }}
                transition={{ duration: FALL_INTERVAL / 1000 }}
              />
            ))}

            {bullets.map((b) => (
              <motion.div
                key={b.id}
                className="absolute bg-white rounded-full"
                style={{ width: BULLET_SIZE, height: BULLET_SIZE, left: b.x, top: b.y }}
                animate={{ top: b.y }}
                transition={{ duration: BULLET_INTERVAL / 1000 }}
              />
            ))}

            <motion.div
              className="absolute rounded-full border-4 border-white"
              style={{
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                bottom: BOTTOM_MARGIN,
                backgroundColor: FIXED_COLOR,
                left: playerX,
              }}
              animate={{ left: playerX }}
              transition={{ left: { duration: 0.2 } }}
            />
          </div>

          <p className="mt-4 text-lg">Use ← / → to move, Spacebar to shoot</p>
        </section>
      </main>
    </div>
  )
}
