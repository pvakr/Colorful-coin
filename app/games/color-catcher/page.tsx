"use client"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import "../../globals.css"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

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
  const [streak, setStreak] = useState(0)
  const { toast } = useToast()
  const [gameOver, setGameOver] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(3) // Start with 3-second countdown

  // --- Refs for reliable interval/timeout access ---
  const playerXRef = useRef(playerX)
  const ballsRef = useRef<Ball[]>(balls)
  const gameOverRef = useRef(gameOver)
  const countdownRef = useRef<number | null>(countdown)

  useEffect(() => { playerXRef.current = playerX }, [playerX])
  useEffect(() => { ballsRef.current = balls }, [balls])
  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { countdownRef.current = countdown }, [countdown])

  // --- Countdown Logic ---
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // --- Ball Dropping and Falling Logic (Game Loop) ---
  useEffect(() => {
    const dropId = setInterval(() => {
      if (gameOverRef.current || countdownRef.current !== null) return
      setBalls((prev) => [
        ...prev,
        { id: Date.now(), color: FIXED_COLOR, x: Math.random() * (CONTAINER_WIDTH - BALL_SIZE), y: 0 },
      ])
    }, DROP_INTERVAL)

    const fallId = setInterval(() => {
      if (gameOverRef.current || countdownRef.current !== null) return
      setBalls((prev) => {
        const moved = prev.map((ball) => ({ ...ball, y: ball.y + CONTAINER_HEIGHT / 70 }))

        // Check collision with player (Game Over condition)
        const playerCenterX = playerXRef.current + PLAYER_SIZE / 2
        // Player's center Y is fixed relative to the bottom
        const playerCenterY = CONTAINER_HEIGHT - BOTTOM_MARGIN - PLAYER_SIZE / 2 
        
        let collided = false
        for (const ball of moved) {
          const ballCenterX = ball.x + BALL_SIZE / 2
          const ballCenterY = ball.y + BALL_SIZE / 2
          const dx = playerCenterX - ballCenterX
          const dy = playerCenterY - ballCenterY
          
          // Collision occurs if distance between centers < sum of radii
          if (Math.hypot(dx, dy) < (PLAYER_SIZE + BALL_SIZE) / 2) { 
            collided = true
            break
          }
        }

        if (collided) {
          setGameOver(true)
          return prev // freeze balls
        }

        // Check for missed balls
        const kept = moved.filter((ball) => ball.y < CONTAINER_HEIGHT) as Ball[]
        const missed = moved.length - kept.length
        if (missed > 0) {
          setStreak(0)
          toast({
            title: "Miss!",
            description: `${missed} ${missed === 1 ? "ball" : "balls"} slipped past`,
            variant: "destructive",
          })
        }
        return kept
      })
    }, FALL_INTERVAL)

    return () => {
      clearInterval(dropId)
      clearInterval(fallId)
    }
  }, [])

  // --- Bullet Movement and Collision Detection Logic (FIX APPLIED HERE) ---
  useEffect(() => {
    const id = setInterval(() => {
      if (gameOverRef.current || countdownRef.current !== null) return
      setBullets((prevBullets) => {
        let hits = 0
        const kept: Bullet[] = []
        const remainingBalls = [...ballsRef.current]

        prevBullets.forEach((b) => {
          const newY = b.y - BULLET_SPEED
          if (newY < 0) return

          const idx = remainingBalls.findIndex((ball) => {
            // Horizontal distance between centers
            const dx = b.x + BULLET_SIZE / 2 - (ball.x + BALL_SIZE / 2)
            
            // CORRECTED: Vertical distance between centers
            const bulletCenterY = newY + BULLET_SIZE / 2 
            const ballCenterY = ball.y + BALL_SIZE / 2
            const dy = bulletCenterY - ballCenterY 

            // Collision check: Distance < Sum of Radii
            return Math.hypot(dx, dy) < (BALL_SIZE + BULLET_SIZE) / 2
          })

          if (idx >= 0) {
            remainingBalls.splice(idx, 1) // Remove the hit ball
            hits++
          } else {
            kept.push({ ...b, y: newY }) // Keep the moving bullet
          }
        })

        if (hits) {
          setScore((s) => s + hits)
          setStreak((st) => st + hits)
          toast({
            title: "Hit!",
            description: `+${hits} • Streak: ${streak + hits}`,
          })
          // Update the main balls state with remaining balls
          setBalls(remainingBalls) 
        }
        return kept
      })
    }, BULLET_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // --- Input Handling ---
  const handleKey = (e: KeyboardEvent) => {
    if (gameOverRef.current || countdownRef.current !== null) return
    
    if (e.key === "ArrowLeft") {
      setPlayerX((x) => Math.max(0, x - MOVE_STEP))
    } else if (e.key === "ArrowRight") {
      setPlayerX((x) => Math.min(CONTAINER_WIDTH - PLAYER_SIZE, x + MOVE_STEP))
    } else if (e.key === " ") {
      e.preventDefault(); // Prevent page scroll when spacebar is pressed
      const bx = playerXRef.current + PLAYER_SIZE / 2 - BULLET_SIZE / 2
      const by = CONTAINER_HEIGHT - BOTTOM_MARGIN - PLAYER_SIZE - BULLET_SIZE
      setBullets((b) => [...b, { id: Date.now(), x: bx, y: by }])
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  // --- Navigation & Game Control ---
  const handleBack = () => {
    router.push("/games")
  }

  const handleRestart = () => {
    setGameOver(false)
    setBalls([])
    setBullets([])
    setScore(0)
    setStreak(0)
    setPlayerX((CONTAINER_WIDTH - PLAYER_SIZE) / 2)
    setCountdown(3) // Restart with countdown
  }

  return (
    <div>
      {/* Back button */}
      <div className="fixed top-6 left-6 z-10">
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

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <section className="w-full max-w-4xl">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center">Color Catcher</h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
                <span>Score</span>
                <span className="font-semibold">{score}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
                <span>Streak</span>
                <span className="font-semibold">{streak}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border rounded-full px-3 py-1">
                <span>Target</span>
                <span
                  aria-label="target color"
                  className="inline-block w-4 h-4 rounded-full border"
                  style={{ backgroundColor: FIXED_COLOR }}
                />
              </span>
            </div>
          </div>

          {/* Game Container */}
          <div
            className="mt-6 mx-auto relative overflow-hidden border-4 border-white shadow-xl"
            style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, backgroundColor: "#1F1B3A" }}
            tabIndex={0} // Ensure div can receive focus for input testing if necessary
          >
            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                <div className="text-6xl sm:text-7xl font-extrabold text-white">{countdown}</div>
              </div>
            )}
            
            {/* Falling Balls */}
            {balls.map((b) => (
              <motion.div
                key={b.id}
                className="absolute rounded-full"
                style={{ width: BALL_SIZE, height: BALL_SIZE, backgroundColor: b.color, left: b.x, top: b.y }}
                animate={{ top: b.y }}
                transition={{ duration: FALL_INTERVAL / 1000 }}
              />
            ))}

            {/* Bullets */}
            {bullets.map((b) => (
              <motion.div
                key={b.id}
                className="absolute bg-white rounded-full"
                style={{ width: BULLET_SIZE, height: BULLET_SIZE, left: b.x, top: b.y }}
                animate={{ top: b.y }}
                transition={{ duration: BULLET_INTERVAL / 1000 }}
              />
            ))}

            {/* Player (Cannon) */}
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
              transition={{ left: { duration: 0.1 } }} // Slightly faster transition for better feel
            />
          </div>

          <p className="mt-4 text-center text-base sm:text-lg">
            Use
            <span className="mx-1 inline-block border rounded px-1.5 py-0.5 text-sm">←</span>
            <span className="mx-1 inline-block border rounded px-1.5 py-0.5 text-sm">→</span>
            to move,
            <span className="mx-1 inline-block border rounded px-1.5 py-0.5 text-sm">Space</span>
            to shoot
          </p>

          {/* Game Over Dialog */}
          <Dialog open={gameOver}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">Game Over</DialogTitle>
                <DialogDescription>
                  Your final score: <span className="font-semibold">{score}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleBack}>Back to Games</Button>
                <Button onClick={handleRestart}>Restart</Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>
      </main>
    </div>
  )
}