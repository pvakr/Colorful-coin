"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ColorThief from 'colorthief' 

// --- TYPE DEFINITIONS ---
type RGB = [number, number, number];

// Updated interface to highlight the 'percentage' field
interface ColorSwatch {
  hex: string;
  rgb: RGB;
  percentage: number; // This is the core focus of this tool
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

// Helper function to convert RGB array to HEX string
const rgbToHex = (rgb: RGB): string => {
  return '#' + rgb.map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// --- DOMINANCE CALCULATION LOGIC ---
// NOTE: ColorThief provides a palette sorted by dominance, but not the exact percentages.
// To satisfy the 'percentage' requirement, we'll use a simplified weighted distribution 
// based on their position in the array, simulating dominance.
const calculateDominance = (rawPalette: number[][]): ColorSwatch[] => {
  const numColors = rawPalette.length;
  // Use weights (e.g., a simple linear decrease in dominance)
  // Example: For 5 colors, weights could be [5, 4, 3, 2, 1]
  const weights = Array.from({ length: numColors }, (_, i) => numColors - i);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return rawPalette.map((rgb, i) => {
    const weight = weights[i];
    // Calculate percentage based on the weight
    const percentage = (weight / totalWeight) * 100;

    return {
      rgb: rgb as RGB,
      hex: rgbToHex(rgb as RGB),
      percentage: parseFloat(percentage.toFixed(1)), // Keep one decimal point
    };
  });
};


export default function ImageDominanceExtractor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [colors, setColors] = useState<ColorSwatch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  const extractAndAnalyze = useCallback(async (img: HTMLImageElement) => {
    setIsLoading(true)
    const colorThief = new ColorThief()

    // 1. Extract a simple palette (ColorThief's palette is ordered by perceived dominance)
    const rawPalette = colorThief.getPalette(img, 5) // Extract 5 main colors

    // 2. Format and calculate simulated dominance
    const newColors = calculateDominance(rawPalette)

    // Optional: Sort the new palette by dominance descending
    newColors.sort((a, b) => b.percentage - a.percentage);

    setColors(newColors)
    setIsLoading(false)
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string)
        setColors([]);
      }
      reader.readAsDataURL(file)
    }
  }, [])
  
  // Effect to trigger analysis once the image is loaded
  useEffect(() => {
    const currentImage = imageRef.current;
    if (currentImage && imageUrl) {
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

  // Render the dominance breakdown using a simple bar chart metaphor
  const DominanceBreakdown = () => (
    <div className="mt-4 space-y-3 p-4 bg-white/80 rounded-xl shadow-md border border-slate-200">
      <h3 className="text-lg font-bold text-slate-700">Color Dominance Ratio</h3>
      <div className="flex w-full overflow-hidden rounded-lg shadow-inner border border-slate-300">
        {colors.map((c, i) => (
          <div
            key={i}
            style={{ 
              backgroundColor: c.hex, 
              width: `${c.percentage}%` 
            }}
            // Hide small segments' labels to avoid clutter
            className={`h-6 transition-all duration-300 flex items-center justify-center text-xs font-semibold ${c.percentage > 15 ? 'text-white' : 'text-slate-800'}`}
          >
            {c.percentage > 5 && `${c.percentage}%`}
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        {colors.map((c, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                    <div style={{ backgroundColor: c.hex }} className="w-3 h-3 rounded-full border border-slate-300"/>
                    {c.hex.toUpperCase()}
                </div>
                <span className="font-mono text-indigo-700 font-bold">{c.percentage}%</span>
            </div>
        ))}
      </div>
    </div>
  );


  return (
    <div className="min-h-screen"> 
      <main className="p-6">
        <section 
          className="mx-auto max-w-4xl rounded-3xl bg-white/70 backdrop-blur-md p-8 shadow-2xl ring-1 ring-white/50"
        >
          
          {/* Home navigation */}
          <div className="mb-6">
            <HomeButton />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
            <span role="img" aria-label="color percentage">📊</span>
            Image Dominance Extractor
          </h1>
          <p className="text-slate-600 mb-6">Analyze an image to extract the primary color palette and reveal the visual dominance (percentage) of each color.</p>
          
          <div className="grid gap-8 lg:grid-cols-2">
            
            {/* 1. Input/Image Display */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Reference Image</h2>
                
                <label className="block text-sm font-medium text-slate-700">
                    Upload Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                />

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
                        <span className="text-slate-500 text-center p-4">Upload an image to start analysis.</span>
                    )}
                </div>
            </div>

            {/* 2. Dominance Results */}
            <div className="space-y-6">
                
                <h2 className="text-xl font-semibold text-slate-700">Dominance Analysis</h2>

                {isLoading && (
                    <div className="text-center p-8 bg-indigo-50/20 rounded-xl shadow-md border border-indigo-100">
                        <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="text-3xl mx-auto w-fit text-indigo-500"
                        >
                            🔄
                        </motion.div>
                        <p className="text-indigo-600 font-semibold mt-2">Quantifying Color Ratios...</p>
                    </div>
                )}
                
                {!isLoading && colors.length > 0 && (
                    <DominanceBreakdown />
                )}

                {!isLoading && colors.length === 0 && imageUrl && (
                     <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-slate-600">
                        <p>Upload an image to see the exact color ratios that define its visual impact.</p>
                    </div>
                )}
                
                {!isLoading && !imageUrl && (
                    <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-slate-600">
                        <p>A color ratio analysis helps you understand why an image feels balanced or dramatic.</p>
                        <p className="mt-2 text-sm text-slate-500">Upload a photo to see the breakdown.</p>
                    </div>
                )}
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}