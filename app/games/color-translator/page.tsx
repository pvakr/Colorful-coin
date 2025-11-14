"use client"
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, MessageCircleQuestion } from 'lucide-react';
import { useRouter } from "next/navigation"

// --- TYPE DEFINITIONS ---
type HSL = [number, number, number];
type Cue = { name: string; hsl: HSL };
type Variant = 'primary' | 'outline';

type ModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
};

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: Variant;
};

// --- CONFIGURATION ---
const COLOR_CUES: Cue[] = [
  { name: "Terracotta", hsl: [24, 52, 59] },       // #D68A59
  { name: "Deep Burgundy", hsl: [329, 87, 28] },  // #880E4F
  { name: "Olive Drab", hsl: [60, 100, 25] },     // #808000
  { name: "Silver Fog", hsl: [210, 5, 63] },      // #99A3A4
  { name: "Copper Rust", hsl: [12, 51, 52] },     // #C36241
  { name: "Dusty Rose", hsl: [330, 24, 69] },     // #B57E88
  { name: "Sea Foam Green", hsl: [150, 48, 75] }, // #9FE2BF
  { name: "Marigold Yellow", hsl: [40, 100, 50] },// #FFC100
  { name: "Midnight Blue", hsl: [240, 67, 18] },  // #191970
  { name: "Charcoal Gray", hsl: [0, 0, 20] },     // #333333
];

// Helper to convert HSL to a CSS string
function hslToStr([h, s, l]: HSL): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Custom Modal Component (A simple implementation of a Dialog for single-file use)
const Modal: React.FC<ModalProps> = ({ isOpen, title, description, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100">
        <div className="p-6">
          <div className="flex items-center gap-3">
            {title.includes("Correct") ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : title.includes("Wrong") || title.includes("Game Over") ? (
              <XCircle className="w-6 h-6 text-rose-500" />
            ) : (
              <MessageCircleQuestion className="w-6 h-6 text-sky-500" />
            )}
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
          <div className="mt-6 flex justify-end">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Button: React.FC<ButtonProps> = ({ children, onClick, className = '', variant = 'primary' }) => {
    const baseClasses = 'px-4 py-2 rounded-full font-medium transition duration-150 ease-in-out shadow-md';
    
    const variantClasses: Record<Variant, string> = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        outline: 'bg-transparent text-gray-700 border border-gray-500 hover:bg-gray-100 shadow-none'
    };
    
    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default function App() {
  const [targetColor, setTargetColor] = useState<HSL>(COLOR_CUES[0].hsl);
  const [correctCue, setCorrectCue] = useState<string>(COLOR_CUES[0].name);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(true); // Track if the last answer was correct
  const router = useRouter()

  const generateRound = () => {
    // 1. Pick a random target color object
    const targetIndex = Math.floor(Math.random() * COLOR_CUES.length);
    const target = COLOR_CUES[targetIndex];

    setTargetColor(target.hsl);
    setCorrectCue(target.name);
    
    // 2. Generate three distractor cues
    const allCues = COLOR_CUES.map(c => c.name);
    let distractorCues = allCues
      .filter(name => name !== target.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // Handle case where we have fewer than 3 distractors (shouldn't happen with the current list)
    if (distractorCues.length < 3) {
        distractorCues = distractorCues.concat(allCues.slice(0, 3 - distractorCues.length));
    }

    // 3. Combine and shuffle options
    const allOptions = [...distractorCues, target.name].sort(() => Math.random() - 0.5);

    setOptions(allOptions);
    setFeedback("");
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handleClick = (selectedCue: string) => {
    const wasCorrect = selectedCue === correctCue;
    
    setIsCorrect(wasCorrect);

    if (wasCorrect) {
      setScore((s) => s + 1);
      setFeedback("Correct! You nailed the description.");
    } else {
      // Set Game Over message and prepare for restart
      setFeedback(`Game Over! The correct cue was '${correctCue}'. Your final score is ${score}.`);
    }
    setIsFeedbackOpen(true);
  };

  const handleNextOrRestart = () => {
    setIsFeedbackOpen(false);
    
    if (isCorrect) {
        // Continue to the next round
        generateRound();
    } else {
        // Game Over: Reset score and start a new game
        setScore(0);
        generateRound();
    }
  }

  const handleBack = () => {
    router.push("/games") // ✅ Navigate back to /games
  }

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center relative antialiased">
      
      {/* Back button container - using fixed positioning */}
      <div className="fixed top-4 left-4 z-10">
        <Button
          variant="outline"
          // Applied custom styling for a plain button
          className="bg-transparent border border-gray-500 text-gray-700 px-4 py-2 text-sm shadow-none hover:bg-gray-100"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      {/* Main content section */}
      <section className="w-full max-w-3xl p-6">
          
        <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center text-indigo-600">
              Color Translator
            </h1>
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium border border-indigo-400/50 bg-indigo-500/10 rounded-full px-3 py-1">
              <span>Score</span>
              <span className="font-semibold text-indigo-600">{score}</span>
            </span>
        </div>

        <p className="mt-8 text-xl sm:text-2xl font-semibold text-center mb-6 text-gray-700">
          Which word best describes this color?
        </p>

        {/* Target Color Block */}
        <div className="flex items-center justify-center">
          <div
            aria-label="Target color to describe"
            className="w-48 h-48 sm:w-64 sm:h-64 rounded-xl shadow-2xl border-4 border-white transition-all duration-500"
            style={{ backgroundColor: hslToStr(targetColor) }}
          >
              <div className="w-full h-full flex items-center justify-center opacity-80">
                  <MessageCircleQuestion className="w-10 h-10 text-white/50" />
              </div>
          </div>
        </div>

        {/* Options grid */}
        <div className="mt-12 grid grid-cols-2 gap-4">
          {options.map((cue, idx) => (
            <Button
              key={idx}
              onClick={() => handleClick(cue)}
              variant="primary"
              className="group w-full py-4 text-lg sm:text-xl rounded-xl tracking-wider uppercase transition-all duration-200 hover:shadow-xl hover:scale-[1.03] focus:ring-4 focus:ring-indigo-300"
            >
              {cue}
            </Button>
          ))}
        </div>
      </section>

      {/* Feedback Modal (Dialog) */}
      <Modal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        title={isCorrect ? "Correct Answer!" : "Game Over"}
        description={feedback}
      >
        <Button onClick={handleNextOrRestart}>
          {isCorrect ? "Next Color" : "Restart Game"}
        </Button>
      </Modal>
    </div>
  );
}