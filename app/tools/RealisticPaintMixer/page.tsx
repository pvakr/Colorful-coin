"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

// --- TYPE DEFINITIONS ---
type RGB = [number, number, number];
// HSL: [Hue (0-360), Saturation (0-1), Lightness (0-1)]
type HSL = [number, number, number]; 

interface ColorSwatch {
  id: number;
  hex: string;
}

// --- COLOR CONVERSION HELPERS ---

// 1. RGB to HSL
const rgbToHsl = ([r, g, b]: RGB): HSL => {
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

// 2. HSL to RGB
const hslToRgb = ([h, s, l]: HSL): RGB => {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360; // Convert H to 0-1 range
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 3. HEX to RGB
const hexToRgb = (hex: string): RGB => {
    // Safely handles short hex codes (e.g. #F00) or invalid input
    if (!/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex)) return [128, 128, 128]; // return gray on invalid
    
    // Normalize to 6 characters
    if (hex.length === 4) {
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }

    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
}

// 4. RGB to HEX
const rgbToHex = ([r, g, b]: RGB): string => {
  const toHex = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}


// --- CORE REALISTIC MIXING LOGIC ---
const realisticMix = (color1: HSL, color2: HSL): HSL => {
    // 1. Simple Average for Hue, Saturation, and Lightness
    const avgH = (color1[0] + color2[0]) / 2;
    const avgS = (color1[1] + color2[1]) / 2;
    const avgL = (color1[2] + color2[2]) / 2;

    // 2. Realistic Pigment Bias (The "Smudging" Effect)
    
    // Bias 1: Desaturation (Pigments rarely mix to create a more vibrant color)
    // Reduce saturation slightly based on how different the hues are.
    const hueDiff = Math.abs(color1[0] - color2[0]);
    const desaturationFactor = Math.min(1, hueDiff / 180) * 0.15; // Max 15% reduction
    const finalS = Math.max(0, avgS - desaturationFactor); 
    
    // Bias 2: Darkening (Pigments absorb light when combined)
    // Reduce lightness slightly, especially if the colors are already dark.
    const darkeningBias = 0.05; // 5% reduction in Lightness
    const finalL = Math.max(0.05, avgL - darkeningBias); // Ensure it's not pure black

    // 3. Final HSL result
    return [avgH, finalS, finalL];
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

export default function RealisticPaintMixer() {
  // Use a default primary color palette
  const [paletteColors, setPaletteColors] = useState<ColorSwatch[]>([
      { id: 1, hex: '#FF0000' }, // Red
      { id: 2, hex: '#0000FF' }, // Blue
      { id: 3, hex: '#FFFF00' }, // Yellow
      { id: 4, hex: '#00FF00' }, // Green
      { id: 5, hex: '#333333' }, // Black
      { id: 6, hex: '#CCCCCC' }, // White
  ]);
  
  // State for the two colors currently selected for mixing
  const [colorA, setColorA] = useState<string>('#FF0000');
  const [colorB, setColorB] = useState<string>('#0000FF');
  
  // Calculate the realistic mix color
  const mixedHex = useMemo(() => {
    try {
        const hslA = rgbToHsl(hexToRgb(colorA));
        const hslB = rgbToHsl(hexToRgb(colorB));
        
        const mixedHsl = realisticMix(hslA, hslB);
        const mixedRgb = hslToRgb(mixedHsl);
        
        return rgbToHex(mixedRgb);
    } catch (e) {
        return '#808080'; // Default to gray on error
    }
  }, [colorA, colorB]);
  
  const getNextId = useCallback(() => (paletteColors.at(-1)?.id || 0) + 1, [paletteColors]);

  const addColorToPalette = useCallback((hex: string) => {
    const newId = getNextId();
    setPaletteColors(p => [...p, { id: newId, hex }]);
  }, [getNextId]);

  const removeColorFromPalette = useCallback((id: number) => {
    setPaletteColors(p => p.filter(c => c.id !== id));
  }, []);

  const updateColorInPalette = useCallback((id: number, hex: string) => {
    setPaletteColors(p => p.map(c => (c.id === id ? { ...c, hex: hex.toUpperCase() } : c)));
  }, []);
  
  // Function to drop a color into one of the mix slots
  const handleDrop = (slot: 'A' | 'B', hex: string) => {
    if (slot === 'A') {
        setColorA(hex);
    } else {
        setColorB(hex);
    }
  }

  // Swatch Component for Palette
  const PaletteSwatch = ({ color }: { color: ColorSwatch }) => (
      <div 
          draggable
          onDragStart={(e) => {
              e.dataTransfer.setData("color/hex", color.hex);
              e.dataTransfer.effectAllowed = "copy";
          }}
          className="relative w-full h-10 rounded-lg shadow-md border border-slate-300 transition-transform hover:scale-105 cursor-grab group"
          style={{ backgroundColor: color.hex }}
      >
          {/* Hidden color and hex inputs for editing */}
          <input
              type="color"
              value={color.hex}
              onChange={(e) => updateColorInPalette(color.id, e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <span className="absolute bottom-0 right-0 text-xs font-mono bg-black/50 text-white px-1 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity">
            {color.hex}
          </span>
          <button 
              onClick={() => removeColorFromPalette(color.id)}
              className="absolute top-0 left-0 text-xs text-white bg-red-600 rounded-tl-lg px-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
          >
              x
          </button>
      </div>
  );
  
  // Mix Slot Component
  const MixSlot = ({ slot, color }: { slot: 'A' | 'B', color: string }) => {
    const [isHovering, setIsHovering] = useState(false);
      
    return (
        <div 
            onDragEnter={() => setIsHovering(true)}
            onDragLeave={() => setIsHovering(false)}
            onDragOver={(e) => e.preventDefault()} // Essential to allow drop
            onDrop={(e) => {
                const hex = e.dataTransfer.getData("color/hex");
                if (hex) handleDrop(slot, hex);
                setIsHovering(false);
            }}
            style={{ backgroundColor: color }}
            className={`flex flex-col items-center justify-center h-40 rounded-xl shadow-xl transition-all duration-200 border-4 ${
                isHovering ? 'border-indigo-500 ring-4 ring-indigo-200' : 'border-slate-300'
            }`}
        >
            <span className="text-xl font-bold bg-white/70 backdrop-blur-sm px-3 py-1 rounded shadow-md text-slate-800">
                Color {slot}
            </span>
            <span className="text-sm font-mono mt-1 bg-black/50 text-white px-2 rounded">
                {color}
            </span>
        </div>
    );
  }

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
            <span role="img" aria-label="paint mixer">🧪</span>
            Realistic Paint Mixer (HSL Smudging)
          </h1>
          <p className="text-slate-600 mb-6">Drag two colors from the palette onto the mixing slots to see a blend that simulates real-world pigment physics (darkening and desaturation).</p>
          
          <div className="grid gap-8 lg:grid-cols-4">
            
            {/* 1. Base Palette (Left Column) */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Palette</h2>
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-100/70 rounded-xl border border-slate-200 shadow-inner max-h-[400px] overflow-y-auto">
                    {paletteColors.map(color => (
                        <PaletteSwatch key={color.id} color={color} />
                    ))}
                </div>
                <motion.button
                    onClick={() => addColorToPalette('#999999')}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors shadow-md"
                >
                    + Add New Color
                </motion.button>
            </div>

            {/* 2. Mixing Slots & Result (Right Columns) */}
            <div className="lg:col-span-3 space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Mixing Lab</h2>
                
                <div className="grid grid-cols-2 gap-4">
                    <MixSlot slot="A" color={colorA} />
                    <MixSlot slot="B" color={colorB} />
                </div>
                
                <h2 className="text-xl font-semibold text-slate-700 pt-4">Resulting Pigment</h2>
                
                {/* MIX RESULT SWATCH - Now Drag-and-Drop Enabled */}
                <div 
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData("color/hex", mixedHex);
                        e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="relative h-40 rounded-xl shadow-2xl transition-colors duration-500 border-4 border-slate-400 flex flex-col items-center justify-center cursor-grab group" 
                    style={{ backgroundColor: mixedHex }}
                >
                    <span className="text-2xl font-extrabold bg-white/70 backdrop-blur-sm px-4 py-2 rounded shadow-lg text-slate-800 transition-opacity group-hover:opacity-0">
                        Mixed Color
                    </span>
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.button
                            onClick={() => addColorToPalette(mixedHex)}
                            whileTap={{ scale: 0.95 }}
                            className="text-white text-lg font-bold bg-green-600/90 hover:bg-green-700/90 px-4 py-2 rounded-lg shadow-xl mr-3"
                        >
                            <span className="text-xl">+</span> Add to Palette
                        </motion.button>
                        <span className="text-xl font-mono text-white bg-black/60 px-3 py-1 rounded-lg">
                             {mixedHex}
                        </span>
                    </div>
                </div>
                
                {/* Comparison to Simple Digital Mix */}
                <div className="pt-4">
                    <h3 className="text-base font-semibold text-slate-700">Why it looks realistic:</h3>
                    <p className="text-sm text-slate-600 mt-1">The algorithm applies a slight **desaturation and darkening bias** (HSL smudging), simulating how real-world pigments absorb light and lose vibrancy when combined, preventing the "digital muddy" look.</p>
                </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}