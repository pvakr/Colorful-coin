"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from "next/navigation";
// --- TYPE DEFINITIONS ---
type RGB = [number, number, number];
type RegionName = 'R1' | 'R2' | 'R3' | 'R4' | 'R5'; // Abstract regions for coloring
type GamePhase = 'MEMORY' | 'COLORING' | 'RESULT';
type Position = { x: number, y: number };

interface SceneConfig {
    name: string;
    colors: Record<RegionName, RGB>;
    draw: (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => void;
}

interface ModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

// --- CONFIGURATION ---
const CANVAS_SIZE = 360;
const MEMORY_TIME_MS = 5000;
const TOTAL_LEVELS = 10;
const PASS_ACCURACY = 100; // Strict requirement for progression
// Reverting to a small, safe tolerance (2) for rectangular shapes
const GRAYSCALE_TOLERANCE = 2; 

// --- DRAWING FUNCTIONS (Geometry for 3 different scenes) ---

// Drawing Function 1: Horizontal Bands (5 regions)
const drawBands = (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => {
    const h = size / 5;
    ctx.fillStyle = rgbToStr(colors.R1); ctx.fillRect(0, 0, size, h);
    ctx.fillStyle = rgbToStr(colors.R2); ctx.fillRect(0, h, size, h);
    ctx.fillStyle = rgbToStr(colors.R3); ctx.fillRect(0, 2 * h, size, h);
    ctx.fillStyle = rgbToStr(colors.R4); ctx.fillRect(0, 3 * h, size, h);
    ctx.fillStyle = rgbToStr(colors.R5); ctx.fillRect(0, 4 * h, size, h);
};

// Drawing Function 2: Checkerboard/Cross (5 regions)
const drawChecker = (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => {
    const s = size / 2;
    const s_quarter = size * 0.25;
    const s_half = size * 0.5;

    // R1, R2, R3, R4: Corner regions
    ctx.fillStyle = rgbToStr(colors.R1); ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = rgbToStr(colors.R2); ctx.fillRect(s, 0, s, s);
    ctx.fillStyle = rgbToStr(colors.R3); ctx.fillRect(0, s, s, s);
    ctx.fillStyle = rgbToStr(colors.R4); ctx.fillRect(s, s, s, s);
    
    // R5: Center square (Drawn on top to define the central region)
    ctx.fillStyle = rgbToStr(colors.R5); 
    ctx.fillRect(s_quarter, s_quarter, s_half, s_half); 
};

// Drawing Function 3: Corner Cross (Replaces the problematic Circles)
const drawCornerCross = (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => {
    const s = size / 2;
    const stripe = size / 5;
    
    // R1: Top-Left Square (Base for all corners)
    ctx.fillStyle = rgbToStr(colors.R1); ctx.fillRect(0, 0, s, s);
    // R2: Top-Right Square
    ctx.fillStyle = rgbToStr(colors.R2); ctx.fillRect(s, 0, s, s);
    // R3: Bottom-Left Square
    ctx.fillStyle = rgbToStr(colors.R3); ctx.fillRect(0, s, s, s);
    // R4: Bottom-Right Square
    ctx.fillStyle = rgbToStr(colors.R4); ctx.fillRect(s, s, s, s);
    
    // R5: Center Cross (Overlaps parts of R1-R4)
    // Horizontal bar
    ctx.fillStyle = rgbToStr(colors.R5); ctx.fillRect(0, size * 0.5 - stripe / 2, size, stripe);
    // Vertical bar
    ctx.fillStyle = rgbToStr(colors.R5); ctx.fillRect(size * 0.5 - stripe / 2, 0, stripe, size);
};

// --- 10 SCENE CONFIGURATIONS (Unique colors and geometries) ---
const SCENE_CONFIGS: SceneConfig[] = [
    { name: "Warm Bands", colors: { R1: [255, 0, 0], R2: [255, 128, 0], R3: [255, 255, 0], R4: [128, 64, 0], R5: [64, 32, 0] }, draw: drawBands },
    { name: "Cool Checker", colors: { R1: [0, 0, 255], R2: [0, 255, 255], R3: [0, 128, 128], R4: [0, 64, 128], R5: [0, 32, 64] }, draw: drawChecker },
    // FIX 1: Scene 3 uses the new rectangular shape
    { name: "Pastel Cross", colors: { R1: [255, 192, 203], R2: [255, 255, 150], R3: [200, 255, 200], R4: [150, 200, 255], R5: [255, 200, 255] }, draw: drawCornerCross },
    { name: "Earth Bands", colors: { R1: [139, 69, 19], R2: [184, 134, 11], R3: [34, 139, 34], R4: [128, 128, 128], R5: [0, 0, 0] }, draw: drawBands },
    { name: "High Contrast Checker", colors: { R1: [255, 0, 0], R2: [0, 255, 0], R3: [0, 0, 255], R4: [255, 255, 255], R5: [0, 0, 0] }, draw: drawChecker },
    // FIX 2: Scene 6 uses a rectangular shape
    { name: "Tropical Cross", colors: { R1: [0, 128, 128], R2: [255, 165, 0], R3: [255, 0, 127], R4: [0, 255, 0], R5: [128, 0, 255] }, draw: drawCornerCross },
    { name: "Grayscale Bands", colors: { R1: [200, 200, 200], R2: [150, 150, 150], R3: [100, 100, 100], R4: [50, 50, 50], R5: [0, 0, 0] }, draw: drawBands },
    { name: "Monochromatic Checker", colors: { R1: [0, 0, 150], R2: [0, 0, 200], R3: [50, 50, 200], R4: [100, 100, 250], R5: [150, 150, 255] }, draw: drawChecker },
    // FIX 3: Scene 9 uses a rectangular shape
    { name: "Retro Checker", colors: { R1: [255, 0, 255], R2: [0, 255, 0], R3: [255, 255, 0], R4: [0, 255, 255], R5: [255, 0, 0] }, draw: drawChecker },
    { name: "Random Bands", colors: { R1: [150, 50, 255], R2: [255, 100, 50], R3: [50, 200, 100], R4: [200, 50, 150], R5: [100, 150, 50] }, draw: drawBands },
];

// --- UTILITY COMPONENTS AND FUNCTIONS ---

function rgbToStr([r, g, b]: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbToGrayscale([r, g, b]: RGB): RGB {
  // Standard luma calculation
  const avg = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  return [avg, avg, avg];
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-full font-medium transition duration-150 ease-in-out shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${className}`}
        >
            {children}
        </button>
    );
};

const Modal: React.FC<ModalProps> = ({ isOpen, title, description, children }) => {
  if (!isOpen) return null;

  // Check for success keywords to display CheckCircle
  const isSuccess = title.includes("Victory") || title.includes("Perfect") || title.includes("100%");

  return (
    // Background blur effect
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="p-8">
          <div className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-600" />
            )}
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="mt-3 text-md text-gray-600">{description}</p>
          <div className="mt-8 flex justify-end">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- GAME LOGIC ---

export default function App() {
    const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null); 
  
  const [phase, setPhase] = useState<GamePhase>('MEMORY');
  const [timer, setTimer] = useState<number>(MEMORY_TIME_MS / 1000);
  const [selectedColor, setSelectedColor] = useState<RGB | null>(null);
  const [cumulativeAccuracy, setCumulativeAccuracy] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Get current scene configuration
  const currentScene = SCENE_CONFIGS[currentLevel];
  const { colors: sceneColors, draw: sceneDrawFunction } = currentScene;

  // Drawing function
  const drawScene = useCallback((ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, drawFunc: (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => void) => {
    const size = CANVAS_SIZE;
    
    // Clear and draw on the main canvas (for display/grayscale conversion)
    ctx.clearRect(0, 0, size, size);
    drawFunc(ctx, colors, size);
    
    // Store the original image data on the hidden canvas (for validation)
    if (originalCanvasRef.current) {
        const originalCtx = originalCanvasRef.current.getContext('2d');
        if (originalCtx) {
            originalCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            originalCtx.drawImage(ctx.canvas, 0, 0); 
        }
    }
  }, []);

  // Effect for MEMORY phase timer and initial draw
  useEffect(() => {
    if (phase !== 'MEMORY') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the full color scene
    drawScene(ctx, sceneColors, sceneDrawFunction);
    

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('COLORING');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, drawScene, sceneColors, sceneDrawFunction, currentLevel]);

  // Effect for COLORING phase setup (Grayscale conversion)
  useEffect(() => {
    if (phase === 'COLORING') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const data = imageData.data;

      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        const [gray] = rgbToGrayscale([r, g, b]);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      
      ctx.putImageData(imageData, 0, 0);
      setSelectedColor(Object.values(sceneColors)[0]); // Auto-select the first color
    }
  }, [phase, sceneColors]);

  // Logic to handle next level transition
  const handleNextLevel = () => {
    setTimer(MEMORY_TIME_MS / 1000);
    setSelectedColor(null);
    setIsModalOpen(false);
    setCurrentLevel(prev => prev + 1);
    setPhase('MEMORY');
  };

  const handleRestartGame = () => {
   router.push("/games");
  };
  
  // Action to restart the CURRENT level
  const handleRestartLevel = () => {
      setTimer(MEMORY_TIME_MS / 1000);
      setSelectedColor(null);
      setIsModalOpen(false);
      setPhase('MEMORY'); // Re-initiate the memory phase for the current level
  }


  // Flood Fill and Canvas Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'COLORING' || !selectedColor) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);
    
    // Get the grayscale color of the pixel clicked
    const clickedData = ctx.getImageData(canvasX, canvasY, 1, 1).data;
    const targetGrayscale: RGB = [clickedData[0], clickedData[1], clickedData[2]];
    
    // Perform fill
    const fillArea = (startX: number, startY: number, target: RGB, fillColor: RGB) => {
        const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const data = imageData.data;
        
        const stack: Position[] = [{x: startX, y: startY}];

        // Using small tolerance to account for minor rounding/rendering differences
        const matchColor = (dataIndex: number, color: RGB): boolean => {
            const r_match = Math.abs(data[dataIndex] - color[0]) <= GRAYSCALE_TOLERANCE;
            const g_match = Math.abs(data[dataIndex + 1] - color[1]) <= GRAYSCALE_TOLERANCE;
            const b_match = Math.abs(data[dataIndex + 2] - color[2]) <= GRAYSCALE_TOLERANCE;

            return r_match && g_match && b_match;
        };

        const setPixel = (dataIndex: number, color: RGB) => {
            data[dataIndex] = color[0];
            data[dataIndex + 1] = color[1];
            data[dataIndex + 2] = color[2];
        };
        
        const getIndex = (px: number, py: number): number => (py * CANVAS_SIZE + px) * 4;

        while(stack.length > 0) {
            const pos = stack.pop();
            if (!pos) continue;

            let { x: px, y: py } = pos;
            if (px < 0 || px >= CANVAS_SIZE || py < 0 || py >= CANVAS_SIZE) continue;

            const index = getIndex(px, py);
            
            if (matchColor(index, target)) {
                setPixel(index, fillColor);
                
                // Simple stack-based flood fill
                stack.push({ x: px + 1, y: py });
                stack.push({ x: px - 1, y: py });
                stack.push({ x: px, y: py + 1 });
                stack.push({ x: px, y: py - 1 });
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    };

    fillArea(canvasX, canvasY, targetGrayscale, selectedColor);
  };
  
  // Validation function
  const validateGame = () => {
    const mainCtx = canvasRef.current?.getContext('2d');
    const originalCtx = originalCanvasRef.current?.getContext('2d');

    if (!mainCtx || !originalCtx) return;

    const mainData = mainCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    const originalData = originalCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    let correctPixels = 0;
    const totalPixels = CANVAS_SIZE * CANVAS_SIZE;

    // Compare the filled canvas (mainData) with the full color scene (originalData)
    for (let i = 0; i < mainData.length; i += 4) {
      if (
        mainData[i] === originalData[i] &&
        mainData[i + 1] === originalData[i + 1] &&
        mainData[i + 2] === originalData[i + 2]
      ) {
        correctPixels++;
      }
    }

    const accuracy = Math.round((correctPixels / totalPixels) * 100);
    setCumulativeAccuracy(prev => [...prev, accuracy]);
    setPhase('RESULT');
    setIsModalOpen(true);
  };

  const currentAccuracy = cumulativeAccuracy[cumulativeAccuracy.length - 1] || 0;
  const passedLevel = currentAccuracy === PASS_ACCURACY;
  const isFinalLevel = currentLevel === TOTAL_LEVELS - 1;
  const isGameOverSuccess = isFinalLevel && passedLevel;
  const shouldRestart = !passedLevel;

  let modalButtonText;
  let modalButtonAction;
  let modalTitle;
  let modalDescription;

  // --- Modal Logic based on 100% rule ---
  if (isGameOverSuccess) {
      modalButtonText = "Challenge Complete! (Play Again)";
      modalButtonAction = handleRestartGame;
      modalTitle = "Perfect Victory!";
      modalDescription = `Incredible! You achieved 100% accuracy on all ${TOTAL_LEVELS} levels.`;
  } else if (shouldRestart) {
      // Restart the current level
      modalButtonText = "Try Again (Restart Level)";
      modalButtonAction = handleRestartLevel;
      modalTitle = "Memory Failed!";
      modalDescription = `Accuracy was **${currentAccuracy}%**. You must score ${PASS_ACCURACY}% to proceed. Try to memorize the colors again!`;
  } else {
      // Move to Next Level (Passed Level, not final)
      modalButtonText = "Next Level";
      modalButtonAction = handleNextLevel;
      modalTitle = "100% Match!";
      modalDescription = `Perfect score! Proceeding to the next level. Your accuracy for Scene ${currentLevel + 1} was **${currentAccuracy}%**.`;
  }

  const levelInfo = (
    <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border border-indigo-400/50 bg-indigo-500/10 rounded-full px-3 py-1">
      <span>Level</span>
      <span className="font-semibold text-indigo-600">{currentLevel + 1} / {TOTAL_LEVELS}</span>
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative antialiased">
      
      {/* Back Button (Styled for Consistency) */}
      <div className="fixed top-4 left-4 z-10">
        <button
          onClick={handleRestartGame} // Action now explicitly goes back to /games
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to games
        </button>
      </div>

      <section className="w-full max-w-lg">
        <div className="flex flex-col items-center gap-2 mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center text-indigo-600">
            Color Shadow
          </h1>
          {levelInfo}
        </div>

        {/* Game State Display */}
        <div className="text-center mb-6">
          {phase === 'MEMORY' && (
            <p className="text-xl text-gray-700 font-medium">
              Memorize **{currentScene.name}** colors! Time remaining: **{timer}s**
            </p>
          )}
          {phase === 'COLORING' && (
            <p className="text-xl text-gray-700 font-medium">
              **Coloring Phase:** Select a color and click the corresponding area.
            </p>
          )}
          {phase === 'RESULT' && (
             <p className="text-xl text-gray-700 font-medium">
                Level Complete! See score below.
            </p>
          )}
        </div>

        {/* Canvas Area */}
        <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden border-4 border-gray-300">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onClick={handleCanvasClick}
            className={`w-full h-full cursor-pointer`}
          />
        </div>
        
        {/* Hidden Canvas for Ground Truth */}
        <canvas ref={originalCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="hidden" />

        {/* Color Swatch Selector */}
        {phase === 'COLORING' && (
          <>
            <div className="flex justify-center gap-4 mt-8">
              {Object.values(sceneColors).map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110 border-4 ${
                    JSON.stringify(selectedColor) === JSON.stringify(color)
                      ? 'border-indigo-500 scale-105'
                      : 'border-white'
                  }`}
                  style={{ backgroundColor: rgbToStr(color) }}
                  aria-label={`Select color option ${index + 1}`}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Button onClick={validateGame} className="text-lg px-8 py-3 bg-emerald-600 hover:bg-emerald-700">
                Finish
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Result Modal */}
      <Modal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
      >
        <Button onClick={modalButtonAction}>
          {modalButtonText}
        </Button>
      </Modal>
    </div>
  );
}