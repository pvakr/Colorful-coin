"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

// --- TYPE DEFINITIONS ---
interface ColorSwatch {
  id: number;
  hex: string;
}

// Helper function to calculate a complementary color (simplified)
const getComplementaryHex = (hex: string): string => {
    // Simple way to get a complementary color: convert hex to RGB, invert, then convert back
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    // Invert the colors
    const rComp = 255 - r;
    const gComp = 255 - g;
    const bComp = 255 - b;

    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(rComp)}${toHex(gComp)}${toHex(bComp)}`.toUpperCase();
}

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

// Initial set of background colors for contrast testing
const INITIAL_BACKGROUNDS: ColorSwatch[] = [
    { id: 1, hex: '#FFFFFF' }, // White
    { id: 2, hex: '#000000' }, // Black
    { id: 3, hex: '#808080' }, // Gray
    { id: 4, hex: '#2C3E50' }, // Deep Blue/Navy
    { id: 5, hex: '#F0E68C' }, // Pale Yellow
    { id: 6, hex: '#FF6B6B' }, // Red
];

export default function ColorRelativityTester() {
  const [targetHex, setTargetHex] = useState('#22A7F0'); // A default medium-saturation blue
  const [backgrounds, setBackgrounds] = useState<ColorSwatch[]>(INITIAL_BACKGROUNDS);
  const [nextId, setNextId] = useState(INITIAL_BACKGROUNDS.length + 1);

  // Calculate a complementary color based on the target color for automatic suggestion
  const complementaryHex = useMemo(() => getComplementaryHex(targetHex), [targetHex]);

  const addBackground = useCallback((hex: string) => {
    setBackgrounds(s => [...s, { id: nextId, hex: hex.toUpperCase() }]);
    setNextId(n => n + 1);
  }, [nextId]);
  
  const updateBackground = useCallback((id: number, hex: string) => {
    setBackgrounds(s => s.map(c => (c.id === id ? { ...c, hex: hex.toUpperCase() } : c)));
  }, []);

  const removeBackground = useCallback((id: number) => {
    setBackgrounds(s => s.filter(c => c.id !== id));
  }, []);

  // Central Swatch size relative to the background cell size
  const centralSwatchSize = '30%'; 

  return (
    <div className="min-h-screen"> 
      <main className="p-6">
        <section 
          className="mx-auto max-w-6xl rounded-3xl bg-white/70 backdrop-blur-md p-8 shadow-2xl ring-1 ring-white/50"
        >
          
          <div className="mb-6">
            <HomeButton />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
            <span role="img" aria-label="color vision test">👁️</span>
            Color Relativity Tester
          </h1>
          <p className="text-slate-600 mb-6">Test how your chosen **Target Color** is visually altered by different background colors due to simultaneous contrast.</p>
          
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* 1. Control Panel (Input) */}
            <div className="lg:col-span-1 space-y-6">
                <h2 className="text-xl font-semibold text-slate-700">Target Color</h2>
                
                <div className="p-5 bg-white/80 rounded-xl border border-slate-300 shadow-md">
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={targetHex}
                            onChange={(e) => setTargetHex(e.target.value.toUpperCase())}
                            className="w-16 h-16 rounded-lg border-none p-0 cursor-pointer"
                        />
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-slate-700">Target HEX Code</label>
                            <input
                                type="text"
                                value={targetHex}
                                onChange={(e) => setTargetHex(e.target.value.toUpperCase())}
                                maxLength={7}
                                className="w-full text-lg font-mono p-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-indigo-400"
                            />
                        </div>
                    </div>
                    <p className="text-xs mt-3 text-slate-500">This central color remains constant—only its *perception* changes.</p>
                </div>
                
                {/* Background Swatch Management */}
                <h2 className="text-xl font-semibold text-slate-700">Background Swatches ({backgrounds.length})</h2>
                
                <div className="space-y-3 p-4 bg-slate-100/70 rounded-xl border border-slate-200 shadow-inner">
                    
                    {/* Quick Add Buttons */}
                    <div className="flex gap-2 pb-2 border-b border-slate-200">
                        <motion.button
                            onClick={() => addBackground('#FFFFFF')}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-100"
                        >
                            + White
                        </motion.button>
                        <motion.button
                            onClick={() => addBackground(complementaryHex)}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs px-3 py-1 bg-red-100 border border-red-300 text-red-700 rounded-full hover:bg-red-200"
                        >
                            + Complementary
                        </motion.button>
                    </div>

                    {backgrounds.map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                            <input
                                type="color"
                                value={c.hex}
                                onChange={(e) => updateBackground(c.id, e.target.value)}
                                className="w-8 h-8 rounded-md border-none p-0 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={c.hex}
                                onChange={(e) => updateBackground(c.id, e.target.value)}
                                maxLength={7}
                                className="flex-grow font-mono p-1.5 rounded-lg border border-slate-300 text-sm bg-white"
                            />
                            <motion.button
                                onClick={() => removeBackground(c.id)}
                                whileTap={{ scale: 0.9 }}
                                className="text-red-500 hover:text-red-700 text-lg transition-colors"
                                title="Remove"
                            >
                                &times;
                            </motion.button>
                        </div>
                    ))}
                    
                    <motion.button
                        onClick={() => addBackground('#333333')}
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-3 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors shadow-md"
                    >
                        Add New Swatch
                    </motion.button>
                </div>
            </div>

            {/* 2. Relativity Grid (Output) */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Relativity Test Grid</h2>
                
                <div 
                    className="grid gap-4 p-4 rounded-xl border border-slate-300 shadow-lg bg-slate-50/70"
                    style={{
                        gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
                    }}
                >
                    {backgrounds.map((bg) => (
                        <div
                            key={bg.id}
                            style={{ backgroundColor: bg.hex }}
                            className="h-48 rounded-xl shadow-xl border border-slate-400 flex flex-col items-center justify-center p-2 transition-colors duration-300"
                        >
                            {/* The Target Swatch - always the same color */}
                            <div
                                style={{ 
                                    backgroundColor: targetHex,
                                    width: centralSwatchSize,
                                    height: centralSwatchSize,
                                }}
                                className="rounded-full shadow-2xl ring-4 ring-white/50 transition-colors duration-300"
                                title={`Target Color: ${targetHex}`}
                            />
                            
                            <p className="text-xs font-mono mt-3 p-1 rounded-md bg-white/70 backdrop-blur-sm shadow-inner text-slate-800">
                                BG: {bg.hex}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}