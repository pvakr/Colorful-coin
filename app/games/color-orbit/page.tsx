"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GameWrapper from "@/components/GameWrapper";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 450;
const WHEEL_RADIUS = 120;
const SEGMENTS = 8;
const SHOOTER_Y = CANVAS_HEIGHT - 50;
const SHOT_SPEED = 30;
const ROTATION_SPEED = 0.1;
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

interface Shot {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
}

export default function ColorOrbitGame() {
    const [sessionHighScore, setSessionHighScore] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [message, setMessage] = useState<string>('Match the shooter color to the wheel segment!');
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rotationRef = useRef<number>(0);
    const shotsRef = useRef<Shot[]>([]);
    const nextShotColorRef = useRef<string>(COLORS[0]);
    const shooterColorIndexRef = useRef<number>(0);
    const rotationSpeedRef = useRef<number>(ROTATION_SPEED);
    const shotIdCounter = useRef<number>(0);

    const wheelCenter = useMemo(() => ({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 50 }), []);
    const segmentAngle = useMemo(() => (2 * Math.PI) / SEGMENTS, []);

    const handleGameOver = useCallback((finalScore: number) => {
        setGameOver(true);
        setSessionHighScore(prevScore => Math.max(prevScore, finalScore));
        setMessage(`Game Over! Final Score: ${finalScore}`);
    }, []);

    const resetGame = useCallback(() => {
        rotationRef.current = 0;
        shotsRef.current = [];
        shooterColorIndexRef.current = 0;
        nextShotColorRef.current = COLORS[0];
        rotationSpeedRef.current = ROTATION_SPEED;
        shotIdCounter.current = 0;
        setScore(0);
        setGameOver(false);
        setGameStarted(true);
        setMessage('Shoot the ball into the matching segment!');
    }, []);

    const shootParticle = useCallback(() => {
        if (gameOver || !gameStarted) return;
        const newShot: Shot = {
            id: shotIdCounter.current++,
            x: CANVAS_WIDTH / 2,
            y: SHOOTER_Y,
            vx: 0,
            vy: -SHOT_SPEED,
            color: nextShotColorRef.current,
        };
        shotsRef.current = [...shotsRef.current, newShot];
        shooterColorIndexRef.current = (shooterColorIndexRef.current + 1) % COLORS.length;
        nextShotColorRef.current = COLORS[shooterColorIndexRef.current];
        rotationSpeedRef.current *= 1.01;
    }, [gameOver, gameStarted]);

    useEffect(() => {
        if (!gameStarted || gameOver) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animationFrameId: number;
        const gameLoop = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            rotationRef.current += rotationSpeedRef.current;

            ctx.save();
            ctx.translate(wheelCenter.x, wheelCenter.y);
            ctx.rotate(rotationRef.current);
            for (let i = 0; i < SEGMENTS; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, WHEEL_RADIUS, i * segmentAngle, (i + 1) * segmentAngle);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fillStyle = COLORS[i % COLORS.length];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.stroke();
            }
            ctx.restore();

            ctx.beginPath();
            ctx.rect(CANVAS_WIDTH / 2 - 20, SHOOTER_Y - 5, 40, 10);
            ctx.fillStyle = '#555';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(CANVAS_WIDTH / 2, SHOOTER_Y, 8, 0, Math.PI * 2);
            ctx.fillStyle = nextShotColorRef.current;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();

            const nextShots: Shot[] = [];
            shotsRef.current.forEach(shot => {
                shot.x += shot.vx;
                shot.y += shot.vy;
                ctx.beginPath();
                ctx.arc(shot.x, shot.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = shot.color;
                ctx.fill();

                const dx = shot.x - wheelCenter.x;
                const dy = shot.y - wheelCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= WHEEL_RADIUS) {
                    let impactAngle = Math.atan2(dy, dx) - rotationRef.current;
                    impactAngle = (impactAngle % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
                    const epsilon = 1e-6;
                    const segmentIndexRaw = (impactAngle + epsilon) / segmentAngle;
                    const segmentIndex = Math.floor(segmentIndexRaw);
                    const segmentColor = COLORS[segmentIndex % COLORS.length];
                    if (shot.color === segmentColor) {
                        setScore(s => s + 1);
                        setMessage('Perfect Match! +1');
                    } else {
                        handleGameOver(score);
                    }
                } else if (shot.y > 0) {
                    nextShots.push(shot);
                }
            });
            shotsRef.current = nextShots;
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameStarted, gameOver, segmentAngle, wheelCenter, handleGameOver, score]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            shootParticle();
        }
    }, [shootParticle]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <GameWrapper
            title="Color Orbit"
            description="Launch balls into matching wheel segments!"
            stats={[
                { label: "Score", value: score, icon: null },
                { label: "High Score", value: sessionHighScore, icon: null },
            ]}
        >
            <div className="w-full max-w-lg">
                {!gameStarted || gameOver ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center w-full min-h-[400px] text-center"
                    >
                        {gameOver && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 mb-6 w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl"
                            >
                                <p className="text-2xl font-bold text-white mb-2">GAME OVER!</p>
                                <p className="text-white/80">{message}</p>
                            </motion.div>
                        )}
                        <Button
                            onClick={resetGame}
                            className="bg-white/20 backdrop-blur hover:bg-white/30 text-lg px-8"
                        >
                            {gameOver ? 'Play Again' : 'Start Orbit Shooter'}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full flex flex-col items-center"
                    >
                        <p className="text-white/80 mb-4 text-center">{message}</p>
                        <motion.canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="border-4 border-white/20 rounded-xl shadow-2xl cursor-pointer"
                            onClick={shootParticle}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                        <p className="mt-2 text-sm text-white/50">
                            Rotation Speed: {(rotationSpeedRef.current / ROTATION_SPEED).toFixed(1)}x
                        </p>
                    </motion.div>
                )}
            </div>
        </GameWrapper>
    );
}
