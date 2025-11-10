"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { useRouter } from "next/navigation"
// --- Type Definitions ---
interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number; // 0.0 to 1.0
}

interface Tile extends RgbaColor {
  id: number;
  label: string;
}

// --- Utility Functions ---

// Base canvas the tiles are layered onto (Pure White, Opaque)
const initialCanvasRgba: RgbaColor = { r: 255, g: 255, b: 255, a: 1.0 };
const TILE_COUNT = 4;
const PASS_SCORE_THRESHOLD = 95;

/** Generates a random RGBA color object with transparency. */
const generateRandomRgba = (): RgbaColor => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
  a: parseFloat((Math.random() * 0.4 + 0.3).toFixed(2)), // Opacity between 0.3 and 0.7
});

/** Converts an RGBA object to a CSS color string. */
const rgbaToCss = (rgba: RgbaColor): string => 
  `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;

/**
 * Blends a foreground color onto a background color using the alpha blending formula.
 */
const blendColors = (foreground: RgbaColor, background: RgbaColor): RgbaColor => {
  const Af = foreground.a;
  const Ab = background.a;
  
  // Result Alpha (Ar)
  const Ar = Af + Ab * (1 - Af);

  // If Ar is zero, return black transparent
  if (Ar < 1e-6) return { r: 0, g: 0, b: 0, a: 0.0 };
  
  // Result Color (Cr) - (R, G, B components are blended linearly)
  const Rr = (foreground.r * Af + background.r * Ab * (1 - Af)) / Ar;
  const Gr = (foreground.g * Af + background.g * Ab * (1 - Af)) / Ar;
  const Br = (foreground.b * Af + background.b * Ab * (1 - Af)) / Ar;
  
  return {
    r: Math.round(Rr),
    g: Math.round(Gr),
    b: Math.round(Br),
    a: parseFloat(Ar.toFixed(4)), // Keep alpha precise
  };
};

/**
 * Calculates a similarity score (0 to 100) based on Euclidean distance in RGBA space.
 * 100 is a perfect match.
 */
const getSimilarityScore = (target: RgbaColor, player: RgbaColor): number => {
  // Max difference in R, G, B is 255. Max difference in A is 1.
  // To weight them equally, we scale A up by 255.
  const scaledTargetA = target.a * 255;
  const scaledPlayerA = player.a * 255;

  // Max distance in 4D RGBA space (sqrt(4 * 255^2)) = 510
  const maxDistance = 510; 
  
  const distance = Math.sqrt(
    Math.pow(target.r - player.r, 2) +
    Math.pow(target.g - player.g, 2) +
    Math.pow(target.b - player.b, 2) +
    Math.pow(scaledTargetA - scaledPlayerA, 2) // Compare scaled Alpha
  );

  // Normalize distance to a score (100 = max similarity, 0 = min similarity)
  return Math.max(0, Math.round(100 * (1 - (distance / maxDistance))));
};

/**
 * Generates the necessary colors (target and source tiles) for one round.
 */
const setupNewPuzzle = (): { target: RgbaColor, sources: Tile[], correctOrder: number[] } => {
  let sources: Tile[] = [];
  let correctOrder: number[] = [];
  const tileLabels = ['A', 'B', 'C', 'D'];

  // 1. Generate 4 unique semi-transparent source tiles
  for (let i = 0; i < TILE_COUNT; i++) {
    sources.push({ ...generateRandomRgba(), id: i, label: tileLabels[i] });
  }

  // 2. Determine a correct, random stacking order (permutation of 0, 1, 2, 3)
  const indices = Array.from({ length: TILE_COUNT }, (_, i) => i);
  // Simple shuffle
  correctOrder = indices.sort(() => Math.random() - 0.5);

  // 3. Calculate the target color based on the correct order
  let targetColor = initialCanvasRgba;
  for (const index of correctOrder) {
    targetColor = blendColors(sources[index], targetColor);
  }

  return { 
    target: targetColor, 
    sources, 
    correctOrder 
  };
};

// --- Reusable UI Components (Consistent with user's style) ---

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
  description: React.ReactNode; // FIX: Changed type to accept JSX content (like <p>)
  children: React.ReactNode;
}> = ({ open, onOpenChange, title, description, children }) => {
  if (!open) return null;

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
          {/* FIX: Changed wrapper from <p> to <div> to allow nested <p> tags in the description content */}
          <div className="text-sm text-gray-400">{description}</div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main Game Component ---

export default function ColorDepthField() {
  const handleBack = () => {
    console.log("Navigating back to /games (simulated)");
     router.push("/games");
  };
  const router = useRouter() 
  const [target, setTarget] = useState<RgbaColor>(initialCanvasRgba);
  const [sources, setSources] = useState<Tile[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);
  
  const [stackOrder, setStackOrder] = useState<number[]>([]); // Player's current order of source tile IDs
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const startNewRound = useCallback(() => {
    // Initial client-side load/new round setup
    const puzzle = setupNewPuzzle();
    setTarget(puzzle.target);
    setSources(puzzle.sources);
    setCorrectOrder(puzzle.correctOrder);
    setStackOrder([]); // Reset stack
    setRound(r => r + 1);
    setIsFeedbackOpen(false);
  }, []);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  // --- Core Blending Logic ---
  const blendedColor = useMemo(() => {
    let result = initialCanvasRgba;
    for (const id of stackOrder) {
      const tile = sources.find(s => s.id === id);
      if (tile) {
        result = blendColors(tile, result);
      }
    }
    return result;
  }, [stackOrder, sources]);

  // --- Player Interaction ---
  const handleTileClick = (id: number) => {
    // If tile is not in the stack, add it
    if (!stackOrder.includes(id)) {
      setStackOrder(prev => [...prev, id]);
    }
  };

  const handleRemoveLast = () => {
    setStackOrder(prev => prev.slice(0, -1));
  };
  
  const handleReset = () => {
    setStackOrder([]);
  };

  const handleSubmit = () => {
    if (stackOrder.length !== TILE_COUNT) {
      // NOTE: Using a custom modal is recommended over alert() for production apps
      // but keeping alert() here to match the pattern in the user's reference code.
      alert("Please stack all 4 tiles before submitting!");
      return;
    }

    const finalScore = getSimilarityScore(target, blendedColor);
    setSimilarityScore(finalScore);
    
    let message = '';
    let success = false;

    if (finalScore >= PASS_SCORE_THRESHOLD) {
      // Award points based on how close they were
      const points = Math.floor(finalScore / 10);
      setScore(s => s + points);
      success = true;
      message = `Perfect Blend! You achieved ${finalScore}% similarity, earning ${points} points.`;
    } else {
      message = `Needs refinement. Your stack achieved ${finalScore}% similarity. Check your order and layer interaction!`;
    }
    
    setFeedbackMessage(message);
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
  
  // Find the required order for the hint
  const requiredOrderLabels = correctOrder.map(id => sources.find(s => s.id === id)?.label).filter(Boolean).join(' → ');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-gray-800 font-sans">
      
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-10">
        <SimpleButton variant="outline" className="text-sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </SimpleButton>
      </div>

      <section className="w-full max-w-5xl py-12">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-fuchsia-600">
            Color Depth Field
          </h1>
          <span className="inline-flex items-center gap-2 text-base font-medium border border-gray-300 rounded-full px-4 py-1 text-gray-700 shadow-sm">
            Round: <span className="font-semibold">{round}</span> | Score: <span className="font-semibold text-fuchsia-600">{score}</span>
          </span>
        </div>

        <p className="mt-8 text-xl text-center text-gray-600">
          Stack the four transparent tiles in the correct **order** to match the Target Color and Opacity.
        </p>

        {/* --- Display Area (Target vs. Player) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 p-6 rounded-2xl bg-white/90 shadow-2xl border border-gray-100">
          
          {/* Target Color */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-3 text-purple-700">Target Layer</h2>
            <div className="relative w-full max-w-xs h-40 rounded-lg shadow-inner border border-gray-200" style={{ backgroundColor: rgbaToCss(initialCanvasRgba) }}>
              {/* Checkerboard pattern for opacity visualization */}
              <div className="absolute inset-0 bg-gray-200/50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ccc 0 10px, #eee 0 20px)', backgroundSize: '20px 20px' }} />
              <div 
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: rgbaToCss(target) }}
              />
            </div>
            <p className='mt-2 text-sm text-gray-500 font-mono'>
              Final Opacity: **{(target.a * 100).toFixed(1)}%**
            </p>
          </div>

          {/* Player Color (Blended Result) */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-3 text-fuchsia-700">Your Blend</h2>
            <div className="relative w-full max-w-xs h-40 rounded-lg shadow-inner border border-gray-200" style={{ backgroundColor: rgbaToCss(initialCanvasRgba) }}>
               {/* Checkerboard pattern for opacity visualization */}
              <div className="absolute inset-0 bg-gray-200/50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ccc 0 10px, #eee 0 20px)', backgroundSize: '20px 20px' }} />
              <div 
                className="absolute inset-0 rounded-lg transition-colors duration-200"
                style={{ backgroundColor: rgbaToCss(blendedColor) }}
              />
            </div>
             <p className='mt-2 text-sm text-gray-500 font-mono'>
              Current Opacity: **{(blendedColor.a * 100).toFixed(1)}%**
            </p>
          </div>
        </div>

        {/* --- Control Area (Source Tiles and Stack) --- */}
        <div className="mt-10 p-6 rounded-2xl bg-white/90 shadow-2xl border border-gray-100">
          
          {/* Available Source Tiles */}
          <h3 className="text-lg font-bold text-gray-700 mb-4">Available Source Tiles (Click to Add):</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            {sources.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                disabled={stackOrder.includes(tile.id)}
                className={`
                  relative w-24 h-16 rounded-lg shadow-md transition-transform duration-100 
                  ${stackOrder.includes(tile.id) 
                    ? 'opacity-50 ring-2 ring-gray-400 cursor-default' 
                    : 'hover:scale-[1.05] active:scale-95 cursor-pointer'}
                `}
              >
                {/* Checkerboard behind the tile color */}
                <div className="absolute inset-0 rounded-lg" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ddd 0 5px, #fff 0 10px)', backgroundSize: '10px 10px' }} />
                <div 
                  className="absolute inset-0 rounded-lg border-2 border-white/50 flex items-center justify-center text-lg font-extrabold text-white/90 shadow-inner"
                  style={{ backgroundColor: rgbaToCss(tile) }}
                >
                  {tile.label}
                </div>
              </button>
            ))}
          </div>

          <div className='mt-8 pt-6 border-t border-gray-200'>
            <h3 className="text-lg font-bold text-gray-700 mb-4">Stacking Order (Bottom to Top):</h3>
            <div className="flex items-center justify-center min-h-[50px] bg-gray-100 rounded-lg p-3 border border-gray-200">
              {stackOrder.length === 0 ? (
                <span className="text-gray-400">Stack is empty. Click a tile to begin.</span>
              ) : (
                stackOrder.map((id, index) => {
                  const tile = sources.find(s => s.id === id);
                  if (!tile) return null;
                  return (
                    <React.Fragment key={id}>
                      {index > 0 && <ChevronRight className="w-5 h-5 text-gray-400 mx-2 flex-shrink-0" />}
                      <span
                        className={`
                          px-4 py-1 rounded-full font-semibold text-sm shadow-md flex-shrink-0
                          bg-indigo-500 text-white
                        `}
                      >
                        {tile.label}
                      </span>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="mt-6 flex justify-center gap-4">
            <SimpleButton onClick={handleRemoveLast} variant="outline" disabled={stackOrder.length === 0} className="text-red-600 border-red-300 hover:bg-red-50">
              Remove Last
            </SimpleButton>
            <SimpleButton onClick={handleReset} variant="outline" disabled={stackOrder.length === 0} className="text-gray-600 border-gray-300 hover:bg-gray-100">
              <RotateCcw className="w-4 h-4 mr-2"/>
              Reset Stack
            </SimpleButton>
            <SimpleButton 
              onClick={handleSubmit} 
              disabled={stackOrder.length !== TILE_COUNT}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Submit Blend
            </SimpleButton>
          </div>
        </div>


        {/* Feedback Dialog */}
        <SimpleDialog
          open={isFeedbackOpen}
          onOpenChange={setIsFeedbackOpen}
          title={FeedbackTitle}
          description={
            <>
              <p>{feedbackMessage}</p>
              {!isSuccess && (
                <p className='mt-3 text-sm text-gray-300'>
                  Required Order: <span className='font-mono text-white'>{requiredOrderLabels}</span>
                </p>
              )}
            </>
          }
        >
          <SimpleButton variant="outline" onClick={handleBack}>
            Back to Games
          </SimpleButton>
          <SimpleButton onClick={startNewRound}>
            Next Puzzle
          </SimpleButton>
        </SimpleDialog>
      </section>
    </div>
  );
}