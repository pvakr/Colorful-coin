"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"

// --- Constants ---
const FLASH_DURATION = 1500 // Time the primary color is shown
const BLANK_DURATION = 3000 // Time the blank screen is shown
const CHOICES_COUNT = 4

// Helper function to convert HSL to a valid CSS HSL string
const hslToCss = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`

// Helper function to calculate the complementary hue (opposite on the color wheel)
const getComplementaryHue = (hue: number) => (hue + 180) % 360

// Simple Dialog component for consistency (must be self-contained)
const SimpleDialog = ({ open, onOpenChange, title, description, children }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: React.ReactNode;
    description: React.ReactNode; 
    children: React.ReactNode;
}) => {
    if (!open) return null;
    return (
        <div 
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={() => onOpenChange(false)}
        >
            <div 
                className="w-full max-w-sm rounded-xl border border-white/20 bg-gray-900/90 backdrop-blur-md shadow-2xl p-6 transition-transform duration-300 scale-100"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="flex flex-col gap-2 mb-4">
                    <div className="text-2xl font-bold text-white">{title}</div>
                    <div className="text-sm text-white/70">{description}</div> 
                </div>
                <div className="mt-6 flex justify-end gap-3 pt-2">
                    {children}
                </div>
            </div>
        </div>
    )
}

// Simple button component
const Button = ({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95 border border-white/30 text-white ${className}`}
    >
        {children}
    </button>
)

// --- Game Logic ---

export default function SpectrumFlashpoint() {
    const [score, setScore] = useState(0)
    const [targetPrimaryHue, setTargetPrimaryHue] = useState(-1) 
    const [targetComplementaryColor, setTargetComplementaryColor] = useState('')
    const [choiceColors, setChoiceColors] = useState<string[]>([])
    const [gameState, setGameState] = useState<'LOADING' | 'FLASHING' | 'BLANK' | 'CHOICE'>('LOADING') 
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
    const [feedback, setFeedback] = useState<{ title: React.ReactNode; description: React.ReactNode }>({ title: '', description: '' })
    const [roundKey, setRoundKey] = useState(0)

    // Base colors (Primary/Secondary) for the flash
    const BASE_HUES = useMemo(() => [
        { hue: 0, name: 'Red' },        
        { hue: 120, name: 'Green' },    
        { hue: 240, name: 'Blue' },     
        { hue: 60, name: 'Yellow' },    
        { hue: 300, name: 'Magenta' },  
        { hue: 180, name: 'Cyan' },     
    ], [])

    const generateNewRound = useCallback(() => {
        // 1. Pick a random primary hue from the restricted set
        const primaryHueObj = BASE_HUES[Math.floor(Math.random() * BASE_HUES.length)]
        const primaryHue = primaryHueObj.hue
        
        // 2. Calculate the correct complementary color (the after-image hue)
        const complementaryHue = getComplementaryHue(primaryHue)
        
        // Use 70% Saturation for choices to make them slightly less intense than the flash
        const choiceSaturation = 70; 
        const choiceLightness = 55;

        const correctComplementaryColor = hslToCss(complementaryHue, choiceSaturation, choiceLightness)

        // 3. Generate 3 incorrect choices - FIX: Generate hues close to the complementary hue
        const incorrectHues: number[] = [] 
        const hueOffsets = [-30, -15, 15, 30].sort(() => Math.random() - 0.5).slice(0, CHOICES_COUNT - 1);
        
        for (const offset of hueOffsets) {
            let newHue = (complementaryHue + offset + 360) % 360;
            incorrectHues.push(newHue);
        }

        // 4. Create the final choice list
        const incorrectChoices = incorrectHues.map(h => hslToCss(h, choiceSaturation, choiceLightness))
        const allChoices = [correctComplementaryColor, ...incorrectChoices].sort(() => Math.random() - 0.5)

        setTargetPrimaryHue(primaryHue)
        setTargetComplementaryColor(correctComplementaryColor)
        setChoiceColors(allChoices)
        setGameState('FLASHING') // Start the timer sequence
        setRoundKey(prev => prev + 1)
    }, [BASE_HUES])

    // Effect for Initial Load
    useEffect(() => {
        if (targetPrimaryHue === -1) { 
            generateNewRound()
        }
    }, [targetPrimaryHue, generateNewRound])

    // --- Game Timing Logic ---
    useEffect(() => {
        if (gameState === 'FLASHING') {
            const timer = setTimeout(() => {
                setGameState('BLANK')
            }, FLASH_DURATION)
            return () => clearTimeout(timer)
        }
        if (gameState === 'BLANK') {
            const timer = setTimeout(() => {
                setGameState('CHOICE')
            }, BLANK_DURATION)
            return () => clearTimeout(timer)
        }
    }, [gameState, roundKey])

    // --- Handlers ---
    const handleAnswer = (chosenColor: string) => {
        const isCorrect = chosenColor === targetComplementaryColor
        if (isCorrect) {
            setScore(s => s + 1)
            setFeedback({ 
                title: <span className="flex items-center gap-2 text-emerald-400"><CheckCircle className="w-5 h-5" /> Correct!</span>, 
                description: <p>You saw the complementary after-image perfectly.</p> 
            })
        } else {
            setFeedback({ 
                title: <span className="flex items-center gap-2 text-red-400"><XCircle className="w-5 h-5" /> Wrong!</span>, 
                description: (
                    <div className="space-y-3">
                        <p>The contrast trick got you this time.</p>
                        <p className="text-white/80">The correct complementary color was: <span className="font-semibold" style={{ color: targetComplementaryColor }}>{targetComplementaryColor}</span></p>
                    </div>
                )
            })
        }
        setIsFeedbackOpen(true)
    }

    const handleBack = () => {
        window.location.href = "/games"
    }

    // High Saturation (90) and Mid Lightness (50) for intense flash
    const primaryColorStyle = targetPrimaryHue !== -1 ? { 
        backgroundColor: hslToCss(targetPrimaryHue, 90, 50),
        color: targetPrimaryHue > 60 && targetPrimaryHue < 240 ? '#000' : '#FFF'
    } : {backgroundColor: 'transparent', color: '#FFF'}

    const gameContent = useMemo(() => {
        switch (gameState) {
            case 'LOADING':
                return (
                    <div key="loading" className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-xl text-white/70">
                        <div className="w-10 h-10 rounded-full border-2 border-white/50 animate-spin mb-4" />
                        Initializing Flash...
                    </div>
                )
            case 'FLASHING':
                return (
                    <div 
                        key="flash"
                        className="w-full h-full flex flex-col items-center justify-center text-4xl font-extrabold transition-all duration-300"
                        style={primaryColorStyle}
                    >
                        Focus on the Center
                        <div className="mt-4 w-4 h-4 rounded-full bg-white border-2 border-black/50" />
                    </div>
                )
            case 'BLANK':
                return (
                    // Blank screen is WHITE to maximize the negative after-image effect
                    <div key="blank" className="w-full h-full bg-white flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-black" />
                    </div>
                )
            case 'CHOICE':
                return (
                    <div key="choice" className="w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-900">
                        <p className="text-xl text-white/90 mb-6">What color did you see in the after-image?</p>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            {choiceColors.map((color, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(color)}
                                    className="h-20 rounded-xl shadow-lg border-2 border-white/30 transition-transform hover:scale-[1.03] active:scale-95"
                                    style={{ backgroundColor: color }}
                                    aria-label={`Color choice ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )
        }
    }, [gameState, choiceColors, primaryColorStyle])

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            <div className="fixed top-6 left-6">
                <Button onClick={handleBack} className="bg-transparent hover:bg-transparent border border-white/30 px-3">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Games
                </Button>
            </div>

            <section className="w-full max-w-2xl">
                <div className="flex flex-col items-center gap-3 mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white/90 text-center">Spectrum Flashpoint</h1>
                    <span className="inline-flex items-center gap-2 text-sm font-medium border border-white/30 rounded-full px-3 py-1 text-white/70">
                        <span>Score</span>
                        <span className="font-semibold">{score}</span>
                    </span>
                    <p className="text-white/60 text-center text-sm mt-2">
                        Focus intently on the screen. Identify the complementary color that appears as an after-image.
                    </p>
                </div>

                {/* Game Area */}
                <div className="relative w-full aspect-[4/3] rounded-xl border border-white/30 shadow-xl overflow-hidden">
                    {gameContent}
                </div>
            </section>

            {/* Feedback Dialog */}
            <SimpleDialog 
                open={isFeedbackOpen} 
                onOpenChange={setIsFeedbackOpen} 
                title={feedback.title} 
                description={feedback.description}
            >
                <Button onClick={handleBack} className="bg-gray-800 hover:bg-gray-700">Back to Games</Button>
                <Button onClick={() => { setIsFeedbackOpen(false); generateNewRound(); }} className="bg-indigo-600 hover:bg-indigo-500">Next Flash</Button>
            </SimpleDialog>
        </main>
    )
}