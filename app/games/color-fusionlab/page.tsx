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

// --- Utility Functions ---

/** Generates a random RGB color object. */
const generateRandomRgb = (): RgbColor => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
});

/** Converts an RGB object to a Hex color string. */
const rgbToHex = (rgb: RgbColor): string => {
  const componentToHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${componentToHex(rgb.r)}${componentToHex(rgb.g)}${componentToHex(rgb.b)}`;
};

/**
 * Calculates a similarity score (0 to 100) based on Euclidean distance in RGB space.
 * 100 is a perfect match.
 */
const getSimilarityScore = (target: RgbColor, player: RgbColor): number => {
  // Max distance in 3D RGB space (sqrt(3 * 255^2))
  const maxDistance = 441.67; 
  
  const distance = Math.sqrt(
    Math.pow(target.r - player.r, 2) +
    Math.pow(target.g - player.g, 2) +
    Math.pow(target.b - player.b, 2)
  );

  // Normalize distance to a score (100 = max similarity, 0 = min similarity)
  return Math.max(0, Math.round(100 * (1 - (distance / maxDistance))));
};

// --- Reusable UI Components (Based on user's reference style) ---

const SimpleButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' }> = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:scale-[1.03] active:scale-95';
  
  // Adjusted colors for better contrast on a neutral/light background
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

const initialRgb: RgbColor = { r: 128, g: 128, b: 128 };
const PASS_SCORE_THRESHOLD = 95; // Must achieve 95% similarity or better

export default function ColorFusionLab() {
  const router = useRouter()
  // Navigation placeholder (replicates the user's setup)
  const handleBack = () => {
    console.log("Navigating back to /games (simulated)");
    router.push("/games")
  };

  const [targetRgb, setTargetRgb] = useState<RgbColor>(initialRgb);
  const [round, setRound] = useState(0); 

  const [playerRgb, setPlayerRgb] = useState<RgbColor>(initialRgb);
  const [score, setScore] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [showTargetRgb, setShowTargetRgb] = useState(false); // New state for flash feature

  const targetHex = useMemo(() => rgbToHex(targetRgb), [targetRgb]);
  const playerHex = useMemo(() => rgbToHex(playerRgb), [playerRgb]);

  const startNewRound = useCallback(() => {
    setTargetRgb(generateRandomRgb());
    setPlayerRgb(initialRgb);
    setIsFeedbackOpen(false);
    setRound(r => r + 1);
    setShowTargetRgb(false); // Ensure hidden for new round
  }, []);

  useEffect(() => {
    // This effect runs ONLY on the client after mount.
    startNewRound();
  }, [startNewRound]);

  const handleSliderChange = (color: keyof RgbColor, value: number) => {
    setPlayerRgb(prev => ({ ...prev, [color]: value }));
  };

  const handleSubmit = () => {
    const finalScore = getSimilarityScore(targetRgb, playerRgb);
    setSimilarityScore(finalScore);
    
    // Feature Request: Show Target RGB for 5 seconds
    setShowTargetRgb(true);
    setTimeout(() => {
      setShowTargetRgb(false);
    }, 5000); 
    
    if (finalScore >= PASS_SCORE_THRESHOLD) {
      // Award points based on how close they were
      const points = Math.floor(finalScore / 10);
      setScore(s => s + points);
    }
    
    setIsFeedbackOpen(true);
  };

  const isSuccess = similarityScore >= PASS_SCORE_THRESHOLD;

  const FeedbackTitle = isSuccess ? (
    <span className="flex items-center gap-2 text-green-400">
      <CheckCircle className="w-6 h-6" /> Success!
    </span>
  ) : (
    <span className="flex items-center gap-2 text-red-400">
      <XCircle className="w-6 h-6" /> Needs Work!
    </span>
  );

  return (
    // Removed bg-gray-900 and switched text to a dark color for plain background
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-gray-800 font-sans">
      
      {/* Back Button - Adjusted for light background */}
      <div className="fixed top-6 left-6 z-10">
        <SimpleButton variant="outline" className="text-sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </SimpleButton>
      </div>

      <section className="w-full max-w-4xl py-12">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-600">
            Color Fusion Lab
          </h1>
          {/* Score/Round Indicator - Lightened styling */}
          <span className="inline-flex items-center gap-2 text-base font-medium border border-gray-300 rounded-full px-4 py-1 text-gray-700 shadow-sm">
            Round: <span className="font-semibold">{round}</span> | Score: <span className="font-semibold text-indigo-600">{score}</span>
          </span>
        </div>

        <p className="mt-8 text-xl text-center text-gray-600">
          Recreate the **Target Color** by manipulating the RGB sliders below.
        </p>

        {/* Color Display Area - Styled as a light, lifted card for better UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 p-6 rounded-2xl bg-white/90 shadow-2xl transition-all border border-gray-100">
          
          {/* Target Color */}
          <div className="flex flex-col items-center">
            {/* Adjusted header color for light background */}
            <h2 className="text-xl font-bold mb-3 text-indigo-700">
              Target Color
              {showTargetRgb && (
                <span className="ml-3 text-sm font-mono text-gray-600 transition-opacity duration-300 opacity-100">
                  ({targetRgb.r}, {targetRgb.g}, {targetRgb.b})
                </span>
              )}
            </h2>
            <div 
              className="w-full max-w-xs h-40 rounded-lg shadow-inner transition-colors duration-500 border border-gray-200"
              style={{ backgroundColor: targetHex }}
            />
          </div>

          {/* Player Color */}
          <div className="flex flex-col items-center">
            {/* Adjusted header color for light background */}
            <h2 className="text-xl font-bold mb-3 text-sky-700">Your Color</h2>
            <div 
              className="w-full max-w-xs h-40 rounded-lg shadow-inner transition-colors duration-100 border border-gray-200"
              style={{ backgroundColor: playerHex }}
            />
          </div>
        </div>

        {/* Sliders */}
        <div className="mt-10 space-y-6">
          {([
            { key: 'r', label: 'Red', color: 'red-700' },
            { key: 'g', label: 'Green', color: 'green-700' },
            { key: 'b', label: 'Blue', color: 'blue-700' },
          ] as const).map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <label className={`w-16 text-lg font-semibold text-${color}`}>{label}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={playerRgb[key]}
                onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer range-lg transition-colors duration-200`}
                style={{
                  // Adjusted gradient for better visibility against a light background
                  background: `linear-gradient(to right, #ffffff 0%, ${key === 'r' ? '#ff0000' : key === 'g' ? '#00ff00' : '#0000ff'} 100%)`
                }}
              />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-12 flex justify-center">
          <SimpleButton 
            onClick={handleSubmit} 
            className="w-full sm:w-auto text-xl bg-emerald-600 hover:bg-emerald-700 py-3"
          >
            Check Fusion
          </SimpleButton>
        </div>

        {/* Feedback Dialog (Unchanged) */}
        <SimpleDialog
          open={isFeedbackOpen}
          onOpenChange={setIsFeedbackOpen}
          title={FeedbackTitle}
          description={isSuccess 
            ? `Fantastic! You achieved ${similarityScore}% similarity, earning ${Math.floor(similarityScore / 10)} points.` 
            : `Keep refining! Your similarity was ${similarityScore}%. Try to reach ${PASS_SCORE_THRESHOLD}% or higher.`}
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