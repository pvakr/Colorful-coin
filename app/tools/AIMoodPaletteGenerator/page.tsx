"use client"

import { useState, useCallback, useRef , useEffect} from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

// --- TYPE DEFINITIONS & DATA ---

// Define the structure for a color swatch
interface ColorSwatch {
  hex: string;
}

// Define the moods and their associated 5-color palettes (Simulation Data)
const MoodPalettes: Record<string, string[]> = {
  // Psychological/Emotional Moods
  'Melancholy': ["#1C3144", "#4A5859", "#A9ACB2", "#C99E10", "#545454"], // Deep blues, grays, muted gold
  'Vibrant Joy': ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF9F43"], // Saturated primaries/secondaries
  'Serene Calm': ["#B9E0FF", "#8D9EFF", "#D5F0FF", "#F8F0E3", "#E3DFFD"], // Light, desaturated blues and pastels
  
  // Thematic/Conceptual Moods
  'Cyberpunk': ["#FF00FF", "#00FFFF", "#39FF14", "#0D0D0D", "#7C00FF"], // Neon magenta, cyan, lime green on dark
  'Earthy Forest': ["#386641", "#6A994E", "#A7C957", "#F2E8CF", "#BC4749"], // Deep greens, moss, cream, hint of red earth
  'Vintage Sepia': ["#87695D", "#BCB0A3", "#3C3931", "#DCD5C9", "#A6978D"], // Browns, creams, and dark contrast
  
  // Abstract Moods
  'Energetic': ["#FF3F3F", "#FF9999", "#570000", "#FFC700", "#FF8C00"],
  'Mysterious': ["#2C3E50", "#34495E", "#E74C3C", "#9B59B6", "#1ABC9C"],
};

// Extract all mood keys for the dropdown/suggestions
const MoodKeys = Object.keys(MoodPalettes);

// ---- Reusable Home Button (inline) ----
function HomeButton({
  label = "Back to Tools",
  hrefFallback = "/tools",
  className = "",
}: { label?: string; hrefFallback?: string; className?: string }) {
  const router = useRouter()
  const goHome = useCallback(() => router.push(hrefFallback), [router, hrefFallback])

  return (
    <motion.button
      onClick={goHome}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-slate-800 ring-1 ring-slate-200 shadow-md hover:bg-slate-200 transition-colors ${className}`}
      aria-label="Go to Tools"
    >
      <span className="text-lg">←</span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  )
}

export default function AIMoodPaletteGenerator() {
  const [currentMood, setCurrentMood] = useState(MoodKeys[0]); // Start with the first mood
  const [inputMood, setInputMood] = useState('');
  const [palette, setPalette] = useState<ColorSwatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- AI SIMULATION LOGIC ---
  const generatePalette = useCallback((moodKey: string) => {
    setIsLoading(true);
    // Simulate AI processing time
    setTimeout(() => {
      const hexCodes = MoodPalettes[moodKey] || MoodPalettes['Melancholy']; // Default if key not found
      const newPalette: ColorSwatch[] = hexCodes.map(hex => ({ hex }));
      setPalette(newPalette);
      setCurrentMood(moodKey);
      setIsLoading(false);
    }, 800); // 800ms loading time simulation
  }, []);

  // Initial load
  useEffect(() => {
    generatePalette(currentMood);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple matching: find the closest mood or use the input directly if it matches a key
    const match = MoodKeys.find(key => key.toLowerCase().includes(inputMood.toLowerCase()));
    
    if (match) {
        generatePalette(match);
    } else if (inputMood.trim() !== '') {
        // If it's a new word, generate a palette from a random existing mood to simulate novelty
        const randomKey = MoodKeys[Math.floor(Math.random() * MoodKeys.length)];
        generatePalette(randomKey);
        // Set the current mood to the user's input for display
        setCurrentMood(inputMood.trim());
    }
  };
  
  const handleSuggestionClick = (mood: string) => {
      setInputMood(mood);
      generatePalette(mood);
  }


  return (
    <div className="min-h-screen"> 
      <main className="p-6">
        <section 
          className="mx-auto max-w-4xl rounded-3xl bg-white/70 backdrop-blur-md p-8 shadow-2xl ring-1 ring-white/50"
        >
          
          <div className="mb-6">
            <HomeButton />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
            <span role="img" aria-label="brain and palette">🧠</span>
            AI Mood Palette Generator
          </h1>
          <p className="text-slate-600 mb-6">Enter a word or phrase (e.g., "Cyberpunk", "Calm") and let the AI instantly craft a purpose-driven 5-color palette.</p>
          
          <div className="grid gap-8 lg:grid-cols-5">
            
            {/* 1. Input/Suggestions (Left Column) */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Define the Mood</h2>
                
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={inputMood}
                        onChange={(e) => setInputMood(e.target.value)}
                        placeholder="Enter mood or theme (e.g., Rustic, Futuristic)"
                        className="flex-grow rounded-xl border border-slate-300 p-3 bg-white/90 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm"
                        aria-label="Mood input"
                    />
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-lg"
                    >
                        {isLoading ? 'Loading...' : 'Generate'}
                    </motion.button>
                </form>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">Quick Suggestions:</h3>
                    <div className="flex flex-wrap gap-2">
                        {MoodKeys.map((mood) => (
                            <motion.button
                                key={mood}
                                onClick={() => handleSuggestionClick(mood)}
                                whileTap={{ scale: 0.95 }}
                                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                    currentMood === mood || inputMood === mood
                                        ? 'bg-indigo-500 text-white shadow-md'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                {mood}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Palette Display (Right Column) */}
            <div className="lg:col-span-3 space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Result: <span className="text-indigo-600 capitalize">{currentMood}</span></h2>

                {isLoading ? (
                    <div className="text-center p-12 bg-indigo-50/20 rounded-xl border border-indigo-100 shadow-md">
                        <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="text-4xl mx-auto w-fit text-indigo-500"
                        >
                            ✨
                        </motion.div>
                        <p className="text-indigo-600 font-semibold mt-4">AI is curating your perfect mood palette...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Dominance Bar visualization */}
                        <div className="flex w-full overflow-hidden rounded-lg shadow-xl border border-slate-300 h-16">
                            {palette.map((c, i) => (
                                <div
                                    key={i}
                                    style={{ 
                                        backgroundColor: c.hex, 
                                        width: `${100 / palette.length}%` 
                                    }}
                                    className="h-full transition-all duration-500"
                                />
                            ))}
                        </div>

                        {/* Detailed Swatches */}
                        <div className="flex flex-wrap gap-4 justify-between p-4 bg-slate-100/70 rounded-xl shadow-inner border border-slate-200">
                            {palette.map((c, i) => (
                                <div key={i} className="flex flex-col items-center group min-w-[18%]">
                                    <div 
                                        style={{ backgroundColor: c.hex }} 
                                        className="w-full h-16 rounded-lg shadow-lg border-2 border-white transition-all group-hover:scale-105"
                                    />
                                    {/* HEX Code */}
                                    <span 
                                        className="text-sm font-mono mt-2 text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-200 transition-colors"
                                        onClick={() => navigator.clipboard.writeText(c.hex)}
                                        title={`Click to copy ${c.hex}`}
                                    >
                                        {c.hex.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}