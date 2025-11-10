"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from "next/navigation"
// --- Type Definitions ---
interface RgbColor {
  r: number;
  g: number;
  b: number;
}
interface HslColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

// --- Utility Functions (HSL <-> RGB) ---

/** Converts HSL components to an RGB object. */
const hslToRgb = (h: number, s: number, l: number): RgbColor => {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
};

/** Converts an RGB object to a Hex color string. */
const rgbToHex = (rgb: RgbColor): string => {
  const componentToHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${componentToHex(rgb.r)}${componentToHex(rgb.g)}${componentToHex(rgb.b)}`;
};

// --- Game Logic Utilities ---

const TILE_COUNT = 5;
const SUBTLE_L_DIFFERENCE = 4; // 4% Luminosity difference between base and outlier

interface ColorSet {
  baseRgb: RgbColor;
  outlierRgb: RgbColor;
  backgroundRgb: RgbColor;
  outlierIndex: number;
}

/** Generates a subtly different color set and a misleading background. */
const generateColorSet = (): ColorSet => {
  // 1. Generate Base Color (mid-saturation, mid-luminosity)
  const baseH = Math.floor(Math.random() * 360);
  const baseS = Math.floor(Math.random() * 30) + 50; // 50-80
  let baseL = Math.floor(Math.random() * 15) + 40; // 40-55 (Mid-dark side)

  // 2. Determine Outlier Luminosity
  // Ensure the outlier L is always within 10-90 range
  let outlierL = baseL + (Math.random() < 0.5 ? SUBTLE_L_DIFFERENCE : -SUBTLE_L_DIFFERENCE);
  outlierL = Math.min(90, Math.max(10, outlierL));

  // 3. Generate RGBs
  const baseRgb = hslToRgb(baseH, baseS, baseL);
  const outlierRgb = hslToRgb(baseH, baseS, outlierL);

  // 4. Generate Misleading Background
  // Choose a color that maximizes the perceptual trick (usually high S and high/low L)
  const bgH = (baseH + 180 + Math.floor(Math.random() * 60) - 30) % 360; // Opposite side of color wheel
  const bgS = Math.floor(Math.random() * 20) + 80; // High saturation
  const bgL = baseL < 50 ? 80 : 20; // If base is dark, use bright BG, and vice versa.

  const backgroundRgb = hslToRgb(bgH, bgS, bgL);
  
  // 5. Determine Outlier Position
  const outlierIndex = Math.floor(Math.random() * TILE_COUNT);

  return {
    baseRgb,
    outlierRgb,
    backgroundRgb,
    outlierIndex,
  };
};

// --- Reusable UI Components ---

const SimpleButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' }> = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:scale-[1.03] active:scale-95';
  
  const variantClasses = variant === 'outline'
    ? 'border border-gray-400 text-gray-700 hover:bg-gray-100'
    : 'bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

const SimpleDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
}> = ({ open, onOpenChange, title, description, children }) => {
  if (!open) return null;

  // Popups are kept as is (dark/contrasting theme)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-gray-800 p-6 shadow-2xl transition-all border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main Game Component ---

const initialColorSet: ColorSet = {
  baseRgb: { r: 100, g: 100, b: 100 },
  outlierRgb: { r: 120, g: 120, b: 120 },
  backgroundRgb: { r: 255, g: 255, b: 0 },
  outlierIndex: -1
};

export default function ChromaticFilter() {
    const router = useRouter()
  const handleBack = () => {
    console.log("Navigating back to /games (simulated)");
     router.push("/games")
  };

  const [gameState, setGameState] = useState<ColorSet>(initialColorSet);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isTileLocked, setIsTileLocked] = useState(false); // Prevents multiple clicks per round

  // backgroundHex is no longer used, but kept for reference consistency if needed
  // const backgroundHex = useMemo(() => rgbToHex(gameState.backgroundRgb), [gameState.backgroundRgb]);

  const startNewRound = useCallback(() => {
    // Start with a deterministic state before generating the random set
    setGameState(generateColorSet());
    setRound(r => r + 1);
    setIsFeedbackOpen(false);
    setIsTileLocked(false);
  }, []);

  useEffect(() => {
    // Initial client-side load
    startNewRound();
  }, [startNewRound]);

  const handleTileClick = (index: number) => {
    if (isTileLocked) return;
    
    setIsTileLocked(true);
    const isCorrect = index === gameState.outlierIndex;

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedbackMessage("Perfect! You ignored the illusion.");
    } else {
      setFeedbackMessage("Mistake. The contrast trick got you this time.");
    }
    
    setIsFeedbackOpen(true);
  };

  const FeedbackTitle = feedbackMessage.startsWith("Perfect") ? (
    <span className="flex items-center gap-2 text-green-400">
      <CheckCircle className="w-6 h-6" /> Correct!
    </span>
  ) : (
    <span className="flex items-center gap-2 text-red-400">
      <XCircle className="w-6 h-6" /> Incorrect
    </span>
  );
  
  /** * FIX: This function now returns the RgbColor object, not a hex string,
   * matching the type expected by getRgbStyle.
   */
  const getTileColor = (index: number): RgbColor => 
    index === gameState.outlierIndex ? gameState.outlierRgb : gameState.baseRgb;

  const getRgbStyle = (rgb: RgbColor) => ({
    backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-gray-800 font-sans">
      
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-10">
        <SimpleButton variant="outline" className="text-sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </SimpleButton>
      </div>

      <section className="w-full max-w-4xl py-12">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-teal-600">
            Chromatic Filter
          </h1>
          <span className="inline-flex items-center gap-2 text-base font-medium border border-gray-300 rounded-full px-4 py-1 text-gray-700 shadow-sm">
            Round: <span className="font-semibold">{round}</span> | Score: <span className="font-semibold text-teal-600">{score}</span>
          </span>
        </div>

        <p className="mt-8 text-xl text-center text-gray-600">
          Find the **one color square** that is different. Ignore the confusing background!
        </p>

        {/* Color Grid Container - The Misleading Element */}
        <div 
          className="w-full max-w-lg mx-auto h-[400px] mt-10 p-6 rounded-2xl shadow-2xl transition-all duration-500 flex items-center justify-center border border-gray-200"
          style={getRgbStyle(gameState.backgroundRgb)}
        >
          <div className="grid grid-cols-2 gap-4 w-full h-full max-w-sm max-h-sm p-4">
            {Array.from({ length: TILE_COUNT }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                disabled={isTileLocked}
                className={`
                  w-full h-full rounded-xl shadow-lg transition-transform duration-150
                  ${isTileLocked ? 'opacity-90 cursor-default' : 'hover:scale-[1.05] active:scale-95'}
                  ${index === TILE_COUNT - 1 ? 'col-span-2 mx-auto max-w-[calc(50%-0.5rem)]' : ''}
                `}
                style={getRgbStyle(getTileColor(index))}
                aria-label={`Color tile ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Additional Hint */}
        {isTileLocked && (
            <div className="mt-6 text-center text-lg font-semibold text-gray-700">
                The actual outlier was tile #{gameState.outlierIndex + 1}.
            </div>
        )}

        {/* Feedback Dialog (Unchanged) */}
        <SimpleDialog
          open={isFeedbackOpen}
          onOpenChange={setIsFeedbackOpen}
          title={FeedbackTitle}
          description={feedbackMessage}
        >
          <SimpleButton variant="outline" onClick={handleBack}>
            Back to Games
          </SimpleButton>
          <SimpleButton onClick={startNewRound}>
            Next Round
          </SimpleButton>
        </SimpleDialog>
      </section>
    </div>
  );
}