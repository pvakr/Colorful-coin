"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from "next/navigation"
import GameWrapper from "@/components/GameWrapper"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

type RGB = [number, number, number]
type RegionName = 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
type GamePhase = 'MEMORY' | 'COLORING' | 'RESULT'
type Position = { x: number; y: number }

interface SceneConfig {
    name: string
    colors: Record<RegionName, RGB>
    draw: (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => void
}

const CANVAS_SIZE = 360
const MEMORY_TIME_MS = 5000
const TOTAL_LEVELS = 10
const PASS_ACCURACY = 100
const GRAYSCALE_TOLERANCE = 2

const drawBands = (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => {
    const h = size / 5
    ctx.fillStyle = rgbToStr(colors.R1); ctx.fillRect(0, 0, size, h)
    ctx.fillStyle = rgbToStr(colors.R2); ctx.fillRect(0, h, size, h)
    ctx.fillStyle = rgbToStr(colors.R3); ctx.fillRect(0, 2 * h, size, h)
    ctx.fillStyle = rgbToStr(colors.R4); ctx.fillRect(0, 3 * h, size, h)
    ctx.fillStyle = rgbToStr(colors.R5); ctx.fillRect(0, 4 * h, size, h)
}

const drawChecker = (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => {
    const s = size / 2
    const s_quarter = size * 0.25
    const s_half = size * 0.5
    ctx.fillStyle = rgbToStr(colors.R1); ctx.fillRect(0, 0, s, s)
    ctx.fillStyle = rgbToStr(colors.R2); ctx.fillRect(s, 0, s, s)
    ctx.fillStyle = rgbToStr(colors.R3); ctx.fillRect(0, s, s, s)
    ctx.fillStyle = rgbToStr(colors.R4); ctx.fillRect(s, s, s, s)
    ctx.fillStyle = rgbToStr(colors.R5); ctx.fillRect(s_quarter, s_quarter, s_half, s_half)
}

const drawCornerCross = (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => {
    const s = size / 2
    const stripe = size / 5
    ctx.fillStyle = rgbToStr(colors.R1); ctx.fillRect(0, 0, s, s)
    ctx.fillStyle = rgbToStr(colors.R2); ctx.fillRect(s, 0, s, s)
    ctx.fillStyle = rgbToStr(colors.R3); ctx.fillRect(0, s, s, s)
    ctx.fillStyle = rgbToStr(colors.R4); ctx.fillRect(s, s, s, s)
    ctx.fillStyle = rgbToStr(colors.R5); ctx.fillRect(0, size * 0.5 - stripe / 2, size, stripe)
    ctx.fillStyle = rgbToStr(colors.R5); ctx.fillRect(size * 0.5 - stripe / 2, 0, stripe, size)
}

const SCENE_CONFIGS: SceneConfig[] = [
    { name: "Warm Bands", colors: { R1: [255, 0, 0], R2: [255, 128, 0], R3: [255, 255, 0], R4: [128, 64, 0], R5: [64, 32, 0] }, draw: drawBands },
    { name: "Cool Checker", colors: { R1: [0, 0, 255], R2: [0, 255, 255], R3: [0, 128, 128], R4: [0, 64, 128], R5: [0, 32, 64] }, draw: drawChecker },
    { name: "Pastel Cross", colors: { R1: [255, 192, 203], R2: [255, 255, 150], R3: [200, 255, 200], R4: [150, 200, 255], R5: [255, 200, 255] }, draw: drawCornerCross },
    { name: "Earth Bands", colors: { R1: [139, 69, 19], R2: [184, 134, 11], R3: [34, 139, 34], R4: [128, 128, 128], R5: [0, 0, 0] }, draw: drawBands },
    { name: "High Contrast Checker", colors: { R1: [255, 0, 0], R2: [0, 255, 0], R3: [0, 0, 255], R4: [255, 255, 255], R5: [0, 0, 0] }, draw: drawChecker },
    { name: "Tropical Cross", colors: { R1: [0, 128, 128], R2: [255, 165, 0], R3: [255, 0, 127], R4: [0, 255, 0], R5: [128, 0, 255] }, draw: drawCornerCross },
    { name: "Grayscale Bands", colors: { R1: [200, 200, 200], R2: [150, 150, 150], R3: [100, 100, 100], R4: [50, 50, 50], R5: [0, 0, 0] }, draw: drawBands },
    { name: "Monochromatic Checker", colors: { R1: [0, 0, 150], R2: [0, 0, 200], R3: [50, 50, 200], R4: [100, 100, 250], R5: [150, 150, 255] }, draw: drawChecker },
    { name: "Retro Checker", colors: { R1: [255, 0, 255], R2: [0, 255, 0], R3: [255, 255, 0], R4: [0, 255, 255], R5: [255, 0, 0] }, draw: drawChecker },
    { name: "Random Bands", colors: { R1: [150, 50, 255], R2: [255, 100, 50], R3: [50, 200, 100], R4: [200, 50, 150], R5: [100, 150, 50] }, draw: drawBands },
]

function rgbToStr([r, g, b]: RGB): string {
    return `rgb(${r}, ${g}, ${b})`
}

function rgbToGrayscale([r, g, b]: RGB): RGB {
    const avg = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    return [avg, avg, avg]
}

export default function ColorShadowGame() {
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const originalCanvasRef = useRef<HTMLCanvasElement>(null)
    
    const [phase, setPhase] = useState<GamePhase>('MEMORY')
    const [timer, setTimer] = useState<number>(MEMORY_TIME_MS / 1000)
    const [selectedColor, setSelectedColor] = useState<RGB | null>(null)
    const [cumulativeAccuracy, setCumulativeAccuracy] = useState<number[]>([])
    const [currentLevel, setCurrentLevel] = useState<number>(0)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [currentAccuracy, setCurrentAccuracy] = useState(0)

    const currentScene = SCENE_CONFIGS[currentLevel]
    const { colors: sceneColors, draw: sceneDrawFunction } = currentScene

    const drawScene = useCallback((ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, drawFunc: (ctx: CanvasRenderingContext2D, colors: Record<RegionName, RGB>, size: number) => void) => {
        const size = CANVAS_SIZE
        ctx.clearRect(0, 0, size, size)
        drawFunc(ctx, colors, size)
        if (originalCanvasRef.current) {
            const originalCtx = originalCanvasRef.current.getContext('2d')
            if (originalCtx) {
                originalCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
                originalCtx.drawImage(ctx.canvas, 0, 0)
            }
        }
    }, [])

    useEffect(() => {
        if (phase !== 'MEMORY') return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        drawScene(ctx, sceneColors, sceneDrawFunction)
        
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval)
                    setPhase('COLORING')
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [phase, drawScene, sceneColors, sceneDrawFunction, currentLevel])

    useEffect(() => {
        if (phase === 'COLORING') {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
            const data = imageData.data
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
                const [gray] = rgbToGrayscale([r, g, b])
                data[i] = gray
                data[i + 1] = gray
                data[i + 2] = gray
            }
            ctx.putImageData(imageData, 0, 0)
            setSelectedColor(Object.values(sceneColors)[0])
        }
    }, [phase, sceneColors])

    const handleNextLevel = () => {
        setTimer(MEMORY_TIME_MS / 1000)
        setSelectedColor(null)
        setIsModalOpen(false)
        setCurrentLevel(prev => prev + 1)
        setPhase('MEMORY')
    }

    const handleRestartLevel = () => {
        setTimer(MEMORY_TIME_MS / 1000)
        setSelectedColor(null)
        setIsModalOpen(false)
        setPhase('MEMORY')
    }

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (phase !== 'COLORING' || !selectedColor) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const scaleX = CANVAS_SIZE / rect.width
        const scaleY = CANVAS_SIZE / rect.height
        const canvasX = Math.floor(x * scaleX)
        const canvasY = Math.floor(y * scaleY)
        const clickedData = ctx.getImageData(canvasX, canvasY, 1, 1).data
        const targetGrayscale: RGB = [clickedData[0], clickedData[1], clickedData[2]]
        
        const fillArea = (startX: number, startY: number, target: RGB, fillColor: RGB) => {
            const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
            const data = imageData.data
            const stack: Position[] = [{x: startX, y: startY}]
            const matchColor = (dataIndex: number, color: RGB): boolean => {
                return Math.abs(data[dataIndex] - color[0]) <= GRAYSCALE_TOLERANCE &&
                       Math.abs(data[dataIndex + 1] - color[1]) <= GRAYSCALE_TOLERANCE &&
                       Math.abs(data[dataIndex + 2] - color[2]) <= GRAYSCALE_TOLERANCE
            }
            const setPixel = (dataIndex: number, color: RGB) => {
                data[dataIndex] = color[0]
                data[dataIndex + 1] = color[1]
                data[dataIndex + 2] = color[2]
            }
            const getIndex = (px: number, py: number): number => (py * CANVAS_SIZE + px) * 4
            while(stack.length > 0) {
                const pos = stack.pop()
                if (!pos) continue

                let { x: px, y: py } = pos
                if (px < 0 || px >= CANVAS_SIZE || py < 0 || py >= CANVAS_SIZE) continue
                const index = getIndex(px, py)
                if (matchColor(index, target)) {
                    setPixel(index, fillColor)
                    stack.push({ x: px + 1, y: py })
                    stack.push({ x: px - 1, y: py })
                    stack.push({ x: px, y: py + 1 })
                    stack.push({ x: px, y: py - 1 })
                }
            }
            ctx.putImageData(imageData, 0, 0)
        }
        fillArea(canvasX, canvasY, targetGrayscale, selectedColor)
    }

    const validateGame = () => {
        const mainCtx = canvasRef.current?.getContext('2d')
        const originalCtx = originalCanvasRef.current?.getContext('2d')
        if (!mainCtx || !originalCtx) return
        const mainData = mainCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data
        const originalData = originalCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data
        let correctPixels = 0
        const totalPixels = CANVAS_SIZE * CANVAS_SIZE
        for (let i = 0; i < mainData.length; i += 4) {
            if (mainData[i] === originalData[i] && mainData[i + 1] === originalData[i + 1] && mainData[i + 2] === originalData[i + 2]) {
                correctPixels++
            }
        }
        const accuracy = Math.round((correctPixels / totalPixels) * 100)
        setCurrentAccuracy(accuracy)
        setCumulativeAccuracy(prev => [...prev, accuracy])
        setPhase('RESULT')
        setIsModalOpen(true)
    }

    const passedLevel = currentAccuracy === PASS_ACCURACY
    const isFinalLevel = currentLevel === TOTAL_LEVELS - 1
    const isGameOverSuccess = isFinalLevel && passedLevel

    let modalButtonText, modalButtonAction, modalTitle, modalDescription
    if (isGameOverSuccess) {
        modalButtonText = "Play Again"
        modalButtonAction = () => { setCurrentLevel(0); setCumulativeAccuracy([]); setIsModalOpen(false); setPhase('MEMORY'); }
        modalTitle = "Perfect Victory!"
        modalDescription = `Incredible! You achieved 100% accuracy on all ${TOTAL_LEVELS} levels.`
    } else if (!passedLevel && phase === 'RESULT') {
        modalButtonText = "Try Again"
        modalButtonAction = handleRestartLevel
        modalTitle = "Memory Failed!"
        modalDescription = `Accuracy was ${currentAccuracy}%. You must score ${PASS_ACCURACY}% to proceed.`
    } else {
        modalButtonText = "Next Level"
        modalButtonAction = handleNextLevel
        modalTitle = "100% Match!"
        modalDescription = `Perfect score! Proceeding to the next level.`
    }

    const levelInfo = (
        <span className="inline-flex items-center gap-2 text-sm font-medium border border-white/30 rounded-full px-3 py-1 bg-white/10 backdrop-blur">
            <span>Level</span>
            <span className="font-semibold">{currentLevel + 1} / {TOTAL_LEVELS}</span>
        </span>
    )

    return (
        <GameWrapper
            title="Color Shadow"
            description="Memorize the colors, then recreate the pattern!"
            stats={[
                { label: "Level", value: `${currentLevel + 1}/${TOTAL_LEVELS}`, icon: null },
                { label: "Time", value: `${timer}s`, icon: null },
                { label: "Accuracy", value: `${currentAccuracy}%`, icon: null },
            ]}
        >
            <div className="w-full max-w-lg">
                <motion.div
                    className="relative w-full aspect-square mx-auto overflow-hidden rounded-xl border-4 border-white/30 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <AnimatePresence mode="wait">
                        {phase === 'MEMORY' && (
                            <motion.div
                                key="memory"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                            >
                                <p className="text-white text-xl font-semibold">Memorize this pattern!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        onClick={handleCanvasClick}
                        className={`w-full h-full cursor-${phase === 'COLORING' ? 'pointer' : 'default'}`}
                    />
                </motion.div>
                <canvas ref={originalCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="hidden" />

                {phase === 'COLORING' && (
                    <>
                        <motion.div
                            className="flex justify-center gap-3 mt-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {Object.values(sceneColors).map((color, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-12 h-12 rounded-full shadow-lg transition-all hover:scale-110 ${
                                        JSON.stringify(selectedColor) === JSON.stringify(color)
                                            ? 'ring-4 ring-white scale-110'
                                            : ''
                                    }`}
                                    style={{ backgroundColor: rgbToStr(color) }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                />
                            ))}
                        </motion.div>
                        <div className="mt-6 flex justify-center">
                            <Button onClick={validateGame} className="bg-white/20 backdrop-blur hover:bg-white/30">
                                Finish
                            </Button>
                        </div>
                    </>
                )}

                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {passedLevel ? (
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-rose-500" />
                                    )}
                                    <h3 className="text-xl font-bold">{modalTitle}</h3>
                                </div>
                                <p className="text-gray-600 mb-6">{modalDescription}</p>
                                <Button onClick={modalButtonAction} className="w-full">
                                    {modalButtonText}
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GameWrapper>
    )
}
