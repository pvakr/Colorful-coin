"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import "../../globals.css"

const colorSet = ["#FF6C00", "#00FFB3", "#FF003C", "#7D4AFF", "#00E4FF", "#FFEA00", "#00FF66", "#FF66CC"]

export default function ColorFrequency() {
  const router = useRouter() // ✅ router defined here

  const [sequence, setSequence] = useState<string[]>([])
  const [input, setInput] = useState<string[]>([])
  const [isShowing, setIsShowing] = useState(true)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [popup, setPopup] = useState<string | null>(null)

  const generateSequence = (length: number): string[] => {
    const shuffled = [...colorSet].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, length)
  }

  useEffect(() => {
    const newSeq = generateSequence(level)
    console.log("New sequence:", newSeq)
    setSequence(newSeq)
    setIsShowing(true)
    setInput([])

    const timer = setTimeout(() => setIsShowing(false), 1500 + level * 400)
    return () => clearTimeout(timer)
  }, [level])

  const handleClick = (color: string) => {
    if (isShowing) return
    const newInput = [...input, color]
    setInput(newInput)
    if (newInput.join("") === sequence.join("")) {
      setPopup("✅ Correct!")
      setScore((s) => s + level)
      setTimeout(() => {
        setLevel((l) => l + 1)
        setPopup(null)
      }, 1000)
    } else if (!sequence.join("").startsWith(newInput.join(""))) {
      setPopup("❌ Try Again")
      setScore(0)
      setTimeout(() => {
        setLevel(1)
        setPopup(null)
      }, 1000)
    }
  }

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
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
        <h2 className="text-4xl font-bold text-[#FF6C00] drop-shadow-[0_0_10px_#FF6C00]">Color Frequency</h2>
        <p className="text-lg text-[#00FFB3]">
          Level: {level} | Score: {score}
        </p>

        {isShowing ? (
          <div className="flex gap-4 justify-center mt-4">
            {sequence.map((color, idx) => (
              <div key={idx} className="w-14 h-14 rounded-md" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 mt-4">
            {colorSet.map((color) => (
              <button
                key={color}
                className="w-14 h-14 rounded-md border-2 border-white"
                style={{ backgroundColor: color }}
                onClick={() => handleClick(color)}
              />
            ))}
          </div>
        )}

        {popup && <div className="text-white text-2xl font-bold mt-4 animate-bounce">{popup}</div>}
      </section>
    </main>
  )
}
