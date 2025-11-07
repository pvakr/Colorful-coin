"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const COLOR_HEX: Record<string, string> = {
  Red: "#ef4444",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Yellow: "#eab308",
  Purple: "#a855f7",
  Orange: "#f97316",
  Pink: "#ec4899",
  Cyan: "#06b6d4",
}

const COLOR_WORDS = Object.keys(COLOR_HEX)

export default function FlashColors() {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [flashColor, setFlashColor] = useState<string>("#ffffff")
  const [correctWord, setCorrectWord] = useState<string>("Red")
  const [choices, setChoices] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<string>("Tap the correct color name")
  const timerRef = useRef<number | null>(null)

  const speed = useMemo(() => Math.max(250, 500 - (round - 1) * 20), [round])

  useEffect(() => {
    if (started) {
      startRound()
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, started])

  function startRound() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]
    setCorrectWord(word)
    setFlashColor(COLOR_HEX[word])

    const distractors = shuffle(COLOR_WORDS.filter(w => w !== word)).slice(0, 3)
    setChoices(shuffle([word, ...distractors]))

    setVisible(true)
    timerRef.current = window.setTimeout(() => setVisible(false), speed)
  }

  function onSelect(choice: string) {
    if (choice === correctWord) {
      setScore(s => s + 1)
      setStatus("✅ Correct!")
    } else {
      setStatus(`❌ Oops — It was ${correctWord}`)
    }
    setTimeout(() => {
      setStatus("Tap the correct color name")
      setRound(r => r + 1)
    }, 500)
  }
    const handleBack = () => {
    router.push("/games") // ✅ Navigate back to /games
  }

  return (
    <div>
      {/* Back Button positioned at the top left slightly */}
      <div className="fixed top-30 left-60">
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

      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 p-6">

      {!started ? (
        <section className="w-full max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-8 shadow-xl text-center">
          <h1 className="text-2xl font-bold mb-4">🎨 Flash Colors</h1>
          <p className="text-gray-600 mb-6">Test your color memory and reflexes!</p>
          <Button
              onClick={() => {
                setStarted(true)
                setRound(1)
                setScore(0)
                setStatus("Tap the correct color name")
              }}
              className="bg-black text-white border hover:bg-gray-800"
            >
              Start Game
            </Button>
        </section>
      ) : (
        <section className="w-full max-w-3xl rounded-2xl bg-white/85 backdrop-blur p-6 shadow-xl">
          <h1 className="text-xl font-bold mb-2">Flash Colors</h1>
          <p className="text-sm opacity-70 mb-4">
            Round {round} · Score {score} · Flash {speed}ms
          </p>

          <div className="h-40 mb-4 rounded-xl border overflow-hidden">
            <div
              className="h-full w-full transition-opacity duration-100"
              style={{ backgroundColor: flashColor, opacity: visible ? 1 : 0 }}
            />
          </div>

          <p className="mb-3 font-medium">{status}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {choices.map(c => (
                <Button
                  key={c}
                  onClick={() => onSelect(c)}
                  className="bg-black text-white border hover:bg-gray-800"
                >
                  {c}
                </Button>
              ))}
           </div>
        </section>
      )}
    </main>
  </div>
  )
}

// ✅ Shuffle helper
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
