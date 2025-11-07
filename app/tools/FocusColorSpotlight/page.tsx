"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

// --- TYPE DEFINITIONS ---
type RGB = [number, number, number];

// --- COLOR CONVERSION HELPERS ---
const hexToRgb = (hex: string): RGB => {
    if (!/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex)) return [128, 128, 128]; 
    if (hex.length === 4) {
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
}

const rgbToHex = ([r, g, b]: RGB): string => {
  const toHex = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Convert RGB to HSL (Hue 0-360, Saturation 0-1, Lightness 0-1)
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
  
  return [h * 360, s, l]; // Hue in degrees, S and L 0-1
}

// Convert HSL to RGB
const hslToRgb = ([h, s, l]: [number, number, number]): RGB => {
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
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        h /= 360; // Convert H to 0-1 range
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};


// --- UTILITY: Calculate perceived color difference (Delta E approximation) ---
const colorDistance = (rgb1: RGB, rgb2: RGB): number => {
    const rmean = (rgb1[0] + rgb2[0]) / 2;
    const r = rgb1[0] - rgb2[0];
    const g = rgb1[1] - rgb2[1];
    const b = rgb1[2] - rgb2[2];
    return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
};

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

export default function FocusColorSpotlight() {
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [focusHex, setFocusHex] = useState<string>('#FF0000'); // Default focus: Red
  const [tolerance, setTolerance] = useState<number>(30); // How 'close' a color needs to be to the focus color
  const [desaturationAmount, setDesaturationAmount] = useState<number>(0.9); // How much to desaturate (0-1)
  const [darkenAmount, setDarkenAmount] = useState<number>(0.5); // How much to darken (0-1)
  const [lightenAmount, setLightenAmount] = useState<number>(0); // How much to lighten (0-1) - NEW
  const [hueShiftAmount, setHueShiftAmount] = useState<number>(0); // How much to shift hue (-180 to 180) - NEW
  const [highlightMode, setHighlightMode] = useState<'spotlight' | 'inverse'>('spotlight'); // NEW: Spotlight or Inverse mode
  
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempImageRef = useRef<HTMLImageElement>(null); // For drawing image to canvas

  // Function to draw image to canvas and apply effect
  const applyEffect = useCallback(() => {
    if (!originalImageUrl || !imageCanvasRef.current || !tempImageRef.current) return;

    setIsLoading(true);

    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        setIsLoading(false);
        return;
    }

    const img = tempImageRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data; // R, G, B, A byte array
    
    const focusRgb = hexToRgb(focusHex);

    for (let i = 0; i < data.length; i += 4) {
      const pixelRgb: RGB = [data[i], data[i + 1], data[i + 2]];
      const isFocusColor = colorDistance(pixelRgb, focusRgb) <= tolerance;

      let [h, s, l] = rgbToHsl(pixelRgb);

      if ((highlightMode === 'spotlight' && !isFocusColor) || (highlightMode === 'inverse' && isFocusColor)) {
        // Apply desaturation
        s = s * (1 - desaturationAmount); 
        // Apply darkening
        l = l * (1 - darkenAmount);
        // Apply lightening
        l = l + (1 - l) * lightenAmount; // Increase lightness toward white
        // Apply hue shift
        h = (h + hueShiftAmount + 360) % 360; // Ensure hue stays within 0-360
      }

      const [r, g, b] = hslToRgb([h, s, l]);

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    ctx.putImageData(imageData, 0, 0);
    setIsLoading(false);
  }, [originalImageUrl, focusHex, tolerance, desaturationAmount, darkenAmount, lightenAmount, hueShiftAmount, highlightMode]); // Added new dependencies

  // Handle image file upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // When the original image loads onto tempImageRef, or parameters change, apply the effect
  useEffect(() => {
    if (tempImageRef.current && originalImageUrl) {
      if (tempImageRef.current.complete) {
        applyEffect();
      } else {
        tempImageRef.current.onload = applyEffect;
      }
    }
  }, [originalImageUrl, applyEffect]);

  // Handle color picking from canvas
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPicking || !imageCanvasRef.current) return;

    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const pixel = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data;
    const pickedHex = rgbToHex([pixel[0], pixel[1], pixel[2]]);
    setFocusHex(pickedHex);
    setIsPicking(false); // Turn off picker mode
  }, [isPicking]);

  // Handle image download
  const handleDownload = useCallback(() => {
    if (!imageCanvasRef.current) return;
    const canvas = imageCanvasRef.current;
    const link = document.createElement('a');
    link.download = `focus-color-spotlight-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);


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
            <span role="img" aria-label="spotlight">💡</span>
            Focus Color Spotlight
          </h1>
          <p className="text-slate-600 mb-6">Upload an image, pick a "Focus Color," and watch as all other colors are desaturated and darkened to make your chosen color pop!</p>
          
          <div className="grid gap-8 lg:grid-cols-5">
            
            {/* 1. Controls (Left Column) */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold text-slate-700">Settings</h2>
                
                {/* Image Upload */}
                <div className="p-4 bg-white/80 rounded-xl border border-slate-300 shadow-md">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                    />
                     {originalImageUrl && (
                         <p className="text-xs mt-2 text-slate-500">Image loaded. Click on the image to pick a focus color.</p>
                     )}
                </div>

                {/* Focus Color Picker */}
                <div className="p-4 bg-white/80 rounded-xl border border-slate-300 shadow-md">
                    <h3 className="text-base font-medium text-slate-700 mb-2">Focus Color</h3>
                    <div className="flex items-center gap-4 mb-3">
                        <input
                            type="color"
                            value={focusHex}
                            onChange={(e) => setFocusHex(e.target.value.toUpperCase())}
                            className="w-12 h-12 rounded-lg border-none p-0 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={focusHex}
                            onChange={(e) => setFocusHex(e.target.value.toUpperCase())}
                            maxLength={7}
                            className="flex-grow text-lg font-mono p-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-indigo-400"
                        />
                    </div>
                    <motion.button
                        onClick={() => setIsPicking(!isPicking)}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-2 rounded-lg font-semibold transition-colors shadow-md ${
                            isPicking ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        }`}
                        disabled={!originalImageUrl}
                    >
                        {isPicking ? 'Click on Image to Pick...' : 'Pick Color from Image'}
                    </motion.button>
                </div>

                {/* Effect Mode (Spotlight vs Inverse) */}
                <div className="p-4 bg-white/80 rounded-xl border border-slate-300 shadow-md">
                    <h3 className="text-base font-medium text-slate-700 mb-2">Effect Mode</h3>
                    <div className="flex space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="spotlight"
                                checked={highlightMode === 'spotlight'}
                                onChange={() => setHighlightMode('spotlight')}
                                className="form-radio text-indigo-600"
                            />
                            <span className="ml-2 text-slate-700">Spotlight (Mute Others)</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="inverse"
                                checked={highlightMode === 'inverse'}
                                onChange={() => setHighlightMode('inverse')}
                                className="form-radio text-indigo-600"
                            />
                            <span className="ml-2 text-slate-700">Inverse (Mute Focus)</span>
                        </label>
                    </div>
                </div>

                {/* Sliders for Effect Intensity */}
                <div className="p-4 bg-white/80 rounded-xl border border-slate-300 shadow-md space-y-4">
                    <h3 className="text-base font-medium text-slate-700">Effect Intensity</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Tolerance: {tolerance} <span className="text-xs text-slate-500">(Color Similarity)</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={tolerance}
                            onChange={(e) => setTolerance(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Desaturation: {(desaturationAmount * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={desaturationAmount}
                            onChange={(e) => setDesaturationAmount(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Darken: {(darkenAmount * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={darkenAmount}
                            onChange={(e) => setDarkenAmount(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Lighten: {(lightenAmount * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={lightenAmount}
                            onChange={(e) => setLightenAmount(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Hue Shift: {hueShiftAmount}°
                        </label>
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={hueShiftAmount}
                            onChange={(e) => setHueShiftAmount(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <motion.button
                        onClick={applyEffect}
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-md"
                        disabled={isLoading || !originalImageUrl}
                    >
                        {isLoading ? 'Applying...' : 'Apply Effect'}
                    </motion.button>
                </div>
            </div>

            {/* 2. Image Display (Right Column) */}
            <div className="lg:col-span-3 space-y-4">
                <h2 className="text-xl font-semibold text-slate-700">Result</h2>
                <div className="relative w-full aspect-video border border-slate-300 rounded-xl overflow-hidden bg-white/80 shadow-lg flex items-center justify-center">
                    {originalImageUrl ? (
                        <>
                            {/* Hidden Image element for loading into canvas */}
                            <img ref={tempImageRef} src={originalImageUrl} alt="Original" className="hidden" crossOrigin="anonymous" />
                            
                            <canvas
                                ref={imageCanvasRef}
                                className={`w-full h-full object-contain ${isPicking ? 'cursor-crosshair ring-4 ring-orange-400' : ''}`}
                                onClick={handleCanvasClick}
                            />
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <motion.div 
                                        animate={{ rotate: 360 }} 
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="text-4xl text-white"
                                    >
                                        ⚙️
                                    </motion.div>
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-slate-500 text-center p-4">Upload an image to start spotlighting colors.</span>
                    )}
                </div>
                {originalImageUrl && (
                    <div className="flex justify-between items-center p-3 bg-slate-100/70 rounded-xl border border-slate-200">
                        <p className="text-sm text-slate-600">
                            💡 Tip: Click 'Apply Effect' after changes, or 'Pick Color' then click image.
                        </p>
                        <motion.button
                            onClick={handleDownload}
                            whileTap={{ scale: 0.95 }}
                            className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                            disabled={!originalImageUrl || isLoading}
                        >
                            Download Image
                        </motion.button>
                    </div>
                )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}