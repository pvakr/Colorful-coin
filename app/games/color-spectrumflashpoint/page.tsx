"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Target, Eye, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import GameWrapper from "@/components/GameWrapper"

// --- Constants ---
const FLASH_DURATION = 1500
const BLANK_DURATION = 3000
const CHOICES_COUNT = 4

const hslToCss = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`
const getComplementaryHue = (hue: number) => (hue + 180) % 360

export default function SpectrumFlashpoint() {
    const [score, setScore] = useState(0)
    const [targetPrimaryHue, setTargetPrimaryHue] = useState(-1) 
    const [targetComplementaryColor, setTargetComplementaryColor] = useState('')
    const [choiceColors, setChoiceColors] = useState<string[]>([])
    const [gameState, setGameState] = useState<'LOADING' | 'FLASHING' | 'BLANK' | 'CHOICE'>('LOADING') 
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
    const [feedback, setFeedback] = useState<{ title: React.ReactNode; description: React.ReactNode }>({ title: '', description: '' })
    const [roundKey, setRoundKey] = useState(0)

    const BASE_HUES = useMemo(() => [
        { hue: 0, name: 'Red' },        
        { hue: 120, name: 'Green' },    
        { hue: 240, name: 'Blue' },     
        { hue: 60, name: 'Yellow' },    
        { hue: 300, name: 'Magenta' },  
        { hue: 180, name: 'Cyan' },     
    ], [])

    const generateNewRound = useCallback(() => {
        const primaryHueObj = BASE_HUES[Math.floor(Math.random() * BASE_HUES.length)]
        const primaryHue = primaryHueObj.hue
        const complementaryHue = getComplementaryHue(primaryHue)
        const choiceSaturation = 70; 
        const choiceLightness = 55;

        const correctComplementaryColor = hslToCss(complementaryHue, choiceSaturation, choiceLightness)

        const incorrectHues: number[] = [] 
        const hueOffsets = [-30, -15, 15, 30].sort(() => Math.random() - 0.5).slice(0, CHOICES_COUNT - 1);
        
        for (const offset of hueOffsets) {
            let newHue = (complementaryHue + offset + 360) % 360;
            incorrectHues.push(newHue);
        }

        const incorrectChoices = incorrectHues.map(h => hslToCss(h, choiceSaturation, choiceLightness))
        const allChoices = [correctComplementaryColor, ...incorrectChoices].sort(() => Math.random() - 0.5)

        setTargetPrimaryHue(primaryHue)
        setTargetComplementaryColor(correctComplementaryColor)
        setChoiceColors(allChoices)
        setGameState('FLASHING')
        setRoundKey(prev => prev + 1)
    }, [BASE_HUES])

    useEffect(() => {
        if (targetPrimaryHue === -1) { 
            generateNewRound()
        }
    }, [targetPrimaryHue, generateNewRound])

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

    const primaryColorStyle = targetPrimaryHue !== -1 ? { 
        backgroundColor: hslToCss(targetPrimaryHue, 90, 50),
        color: targetPrimaryHue > 60 && targetPrimaryHue < 240 ? '#000' : '#FFF'
    } : {backgroundColor: 'transparent', color: '#FFF'}

    const stats: { label: string; value: string | number; icon?: React.ReactNode }[] = [
        { label: "Score", value: score, icon: <Target className="w-4 h-4" /> },
        { label: "Status", value: gameState === 'FLASHING' ? 'Flash!' : gameState === 'BLANK' ? 'Wait...' : gameState === 'CHOICE' ? 'Answer!' : 'Loading', icon: <Zap className="w-4 h-4" /> },
    ];

    const gameContent = useMemo(() => {
        switch (gameState) {
            case 'LOADING':
                return (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-xl text-white/70"
                    >
                        <motion.div 
                            className="w-10 h-10 rounded-full border-2 border-white/50 animate-spin mb-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            Initializing Flash...
                        </span>
                    </motion.div>
                )
            case 'FLASHING':
                return (
                    <motion.div 
                        key="flash"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex flex-col items-center justify-center text-4xl font-extrabold"
                        style={primaryColorStyle}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <Eye className="w-16 h-16 mb-4" />
                        </motion.div>
                        <span className="drop-shadow-lg">Focus on the Center</span>
                        <motion.div 
                            className="mt-6 w-6 h-6 rounded-full bg-white border-2 border-black/50"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    </motion.div>
                )
            case 'BLANK':
                return (
                    <motion.div 
                        key="blank"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full bg-white flex items-center justify-center"
                    >
                        <motion.div 
                            className="w-4 h-4 rounded-full bg-black"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    </motion.div>
                )
            case 'CHOICE':
                return (
                    <motion.div 
                        key="choice"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-900"
                    >
                        <motion.div 
                            className="flex items-center gap-2 text-xl text-white/90 mb-8"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Eye className="w-5 h-5" />
                            What color did you see in the after-image?
                        </motion.div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            {choiceColors.map((color, index) => (
                                <motion.button
                                    key={index}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleAnswer(color)}
                                    className="h-24 rounded-xl shadow-lg border-2 border-white/30 transition-all hover:scale-105 active:scale-95"
                                    style={{ backgroundColor: color }}
                                    aria-label={`Color choice ${index + 1}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )
        }
    }, [gameState, choiceColors, primaryColorStyle])

    return (
        <GameWrapper
            title="Spectrum Flashpoint"
            description="Master the art of complementary colors"
            stats={stats}
        >
            <motion.div
                key={roundKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full aspect-[4/3] rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {gameContent}
                </AnimatePresence>
            </motion.div>

            <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            {feedback.title}
                        </DialogTitle>
                        <DialogDescription className="text-lg">
                            {feedback.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-3">
                        <Button variant="outline" onClick={handleBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Games
                        </Button>
                        <Button onClick={() => { setIsFeedbackOpen(false); generateNewRound(); }} className="bg-gradient-to-r from-indigo-500 to-purple-500">
                            <Zap className="w-4 h-4 mr-2" />
                            Next Flash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </GameWrapper>
    )
}
