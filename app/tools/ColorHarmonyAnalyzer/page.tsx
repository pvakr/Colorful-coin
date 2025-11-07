"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import ColorThief from 'colorthief' 

// --- TYPE DEFINITIONS ---
type RGB = [number, number, number];

interface ColorSwatch {
  hex: string;
  rgb: RGB;
  percentage: number; 
}

interface HarmonyResult {
  scheme: 'Monochromatic' | 'Complementary' | 'Triadic' | 'Analogous' | 'Achromatic' | 'Other';
  score: number; 
  notes: string;
}

// Helper: Converts RGB to HSL for color analysis
// H is 0-360, S and L are 0-1
const rgbToHsl = ([r, g, b]: RGB): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  } else {
    s = 0;
  }
  
  return [Math.round(h * 360), s, l];
}

// ---- Reusable Home Button (inline, adapted from BackButton) ----
function HomeButton({
  label = "Back to Tools", // Changed label to match original context
  hrefFallback = "/tools",
  className = "",
}: { label?: string; hrefFallback?: string; className?: string }) {
  const router = useRouter()
  const goHome = useCallback(() => router.push(hrefFallback), [router, hrefFallback])

  return (
    <motion.button
      onClick={goHome}
      whileTap={{ scale: 0.97 }}
      // Simplified button style: removed bg-white/90, used a simpler hover
      className={`inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-slate-800 ring-1 ring-slate-200 shadow-md hover:bg-slate-200 transition-colors ${className}`}
      aria-label="Go to Tools"
    >
      <span className="text-lg">←</span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  )
}

// Helper function to convert RGB array to HEX string
const rgbToHex = (rgb: RGB): string => {
  return '#' + rgb.map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}


export default function ColorHarmonyAnalyzer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [colors, setColors] = useState<ColorSwatch[]>([])
  const [analysis, setAnalysis] = useState<HarmonyResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // --- ANALYSIS LOGIC (Implemented for basic harmony detection) ---
  const performAnalysis = useCallback((palette: ColorSwatch[]): HarmonyResult => {
    if (palette.length < 3) {
      return {
        scheme: 'Other',
        score: 40,
        notes: "Need at least 3 distinct colors for proper theory analysis.",
      }
    }
    
    const hslPalette = palette.map(c => rgbToHsl(c.rgb));
    const hues = hslPalette.map(h => h[0]);

    // Check for Achromatic (Black, White, Gray - low saturation)
    const avgSaturation = hslPalette.reduce((sum, h) => sum + h[1], 0) / hslPalette.length;
    if (avgSaturation < 0.1) {
        return {
            scheme: 'Achromatic',
            score: 95,
            notes: "A beautiful, timeless achromatic (black/white/gray) palette. Excellent for focus.",
        };
    }

    // Check for Monochromatic (small hue difference)
    const hueRange = Math.max(...hues) - Math.min(...hues);
    if (hueRange <= 20) { // Max 20 degrees difference
        return {
            scheme: 'Monochromatic',
            score: 85,
            notes: `A unified monochromatic scheme with only ${hueRange}° hue range. Great for conveying calm.`,
        };
    }
    
    // Check for Complementary (two hues approx 180 degrees apart)
    // Find the max difference between any two hues (handling wrap-around 360 -> 0)
    let maxAngleDiff = 0;
    for (let i = 0; i < hues.length; i++) {
        for (let j = i + 1; j < hues.length; j++) {
            const diff = Math.abs(hues[i] - hues[j]);
            const angleDiff = Math.min(diff, 360 - diff);
            maxAngleDiff = Math.max(maxAngleDiff, angleDiff);
        }
    }

    if (maxAngleDiff > 160 && maxAngleDiff < 200) { // Check for angle near 180 degrees
        return {
            scheme: 'Complementary',
            score: 90,
            notes: "Strong complementary contrast detected. Excellent visual impact and energy!",
        };
    }

    // Default to Other/Complex
    return { 
        scheme: 'Other', 
        score: 70, 
        notes: "A complex palette with multiple hues. Focus on value contrast to maintain clarity.",
    }

  }, [])


  const extractAndAnalyze = useCallback(async (img: HTMLImageElement) => {
    setIsLoading(true)
    const colorThief = new ColorThief()

    // 1. Extract a simple palette
    // Note: ColorThief does not return color percentage, only a representative palette.
    // For a real-world tool, you'd use a more sophisticated color quantization/clustering library 
    // to get true color dominance (percentage).
    const rawPalette = colorThief.getPalette(img, 5) 

    // 2. Format and type-cast the palette data
    const newColors: ColorSwatch[] = rawPalette.map(rgb => ({
      rgb: rgb as RGB, 
      hex: rgbToHex(rgb as RGB),
      percentage: 100 / rawPalette.length, // Placeholder for dominance
    }))

    setColors(newColors)

    // 3. Perform the Color Harmony Analysis
    const result = performAnalysis(newColors)
    setAnalysis(result)

    setIsLoading(false)
  }, [performAnalysis])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        // Reset analysis when new image is uploaded
        setImageUrl(event.target?.result as string)
        setColors([]);
        setAnalysis(null);
      }
      reader.readAsDataURL(file)
    }
  }, [])
  
  // Effect to trigger analysis once the image is loaded
  useEffect(() => {
    const currentImage = imageRef.current;
    if (currentImage && imageUrl) {
      // Check if image is loaded, if not, wait for onload event
      if (currentImage.complete) {
        extractAndAnalyze(currentImage);
      } else {
        currentImage.onload = () => extractAndAnalyze(currentImage);
        return () => {
            currentImage.onload = null;
        }
      }
    }
  }, [imageUrl, extractAndAnalyze]);

  return (
    // Removed 'bg-slate-50 min-h-screen' to allow for external background
    <div className="min-h-screen"> 
      <main className="p-6">
        <section 
          // Main container styling: more transparent, less aggressive shadow/ring
          className="mx-auto max-w-4xl rounded-3xl bg-white/70 backdrop-blur-md p-8 shadow-2xl ring-1 ring-white/50"
        >
          
          {/* Home navigation */}
          <div className="mb-6">
            <HomeButton />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
            <span role="img" aria-label="paint brush">🎨</span>
            Color Harmony Analyzer
          </h1>
          <p className="text-slate-600 mb-6">Upload an image to extract its primary colors and evaluate the palette's adherence to classic color theory.</p>
          
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* 1. Input/Image Display */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Image Source</h2>
                
                {/* File Input styling improved */}
                <label className="block text-sm font-medium text-slate-700">
                    Upload Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                />

                {/* Image Preview */}
                <div className="w-full aspect-video border border-slate-300 rounded-xl overflow-hidden bg-white/80 flex items-center justify-center shadow-inner">
                    {imageUrl ? (
                        <img 
                            ref={imageRef} 
                            src={imageUrl} 
                            alt="Uploaded reference" 
                            crossOrigin="anonymous" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-slate-500 text-center p-4">Your image preview will appear here.</span>
                    )}
                </div>
            </div>

            {/* 2. Analysis Results (Palette & Score) */}
            <div className="lg:col-span-2 space-y-6">
                
                {isLoading && (
                    <div className="text-center p-8 bg-indigo-50/20 rounded-xl shadow-md border border-indigo-100">
                        <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="text-3xl mx-auto w-fit text-indigo-500"
                        >
                            🔄
                        </motion.div>
                        <p className="text-indigo-600 font-semibold mt-2">Analyzing Colors...</p>
                    </div>
                )}
                
                {!isLoading && analysis && (
                    <>
                        <h2 className="text-xl font-semibold text-slate-700">Harmony Analysis</h2>
                        
                        {/* Harmony Score Card: Cleaner design with distinct color */}
                        <div className="p-5 rounded-xl border border-indigo-300 shadow-lg flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
                            <div>
                                <div className="text-xs font-bold uppercase text-indigo-700">Color Theory Scheme</div>
                                <p className="text-3xl font-extrabold text-indigo-900">{analysis.scheme}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold uppercase text-indigo-700">Harmony Score</div>
                                <p className="text-5xl font-extrabold text-indigo-900">{analysis.score}<span className="text-2xl">%</span></p>
                            </div>
                        </div>

                        {/* Notes: Subtler background */}
                        <div className="bg-slate-100/70 p-4 rounded-lg border border-slate-200">
                            <h3 className="text-base font-semibold text-slate-700 mb-1">Expert Notes</h3>
                            <p className="text-sm text-slate-600">{analysis.notes}</p>
                        </div>
                    </>
                )}
                
                {/* 3. Extracted Palette */}
                <h2 className="text-xl font-semibold text-slate-700">Extracted Palette</h2>
                <div className="flex flex-wrap gap-4 min-h-[50px] border border-slate-200 p-4 rounded-xl bg-slate-100/70 shadow-inner">
                    {colors.length > 0 ? (
                        colors.map((c, i) => (
                            <div key={i} className="flex flex-col items-center group">
                                {/* Color Swatch */}
                                <div 
                                    style={{ backgroundColor: c.hex }} 
                                    className="w-16 h-16 rounded-lg shadow-xl border-2 border-white transition-all group-hover:scale-110"
                                />
                                {/* HEX Code */}
                                <span className="text-xs font-mono mt-2 text-slate-700 opacity-80 group-hover:opacity-100 transition-opacity">
                                    {c.hex.toUpperCase()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm p-2">Upload an image to see the extracted colors.</p>
                    )}
                </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}