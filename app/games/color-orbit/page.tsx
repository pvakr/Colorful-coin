"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Constants ---
const GAME_ID = 'color_orbit';
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 450;
const WHEEL_RADIUS = 120;
const SEGMENTS = 8;
const SHOOTER_Y = CANVAS_HEIGHT - 50;
const SHOT_SPEED = 30; // Pixels per frame
const ROTATION_SPEED = 0.1; // Radians per frame (Difficulty increases this)
const COLORS: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080']; // Red, Green, Blue, Yellow, Magenta, Cyan, Orange, Purple

interface Shot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

// --- Main Game Component ---

const OrbitGame = () => {
  // Session High Score (No persistence)
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('Match the shooter color to the wheel segment!');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  
  const rotationRef = useRef<number>(0); // Current rotation angle of the wheel
  const shotsRef = useRef<Shot[]>([]); // Array of active shots
  const nextShotColorRef = useRef<string>(COLORS[0]);
  const shooterColorIndexRef = useRef<number>(0);
  const rotationSpeedRef = useRef<number>(ROTATION_SPEED);
  const shotIdCounter = useRef<number>(0);
  
  const wheelCenter = useMemo(() => ({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 50 }), []);
  const segmentAngle = useMemo(() => (2 * Math.PI) / SEGMENTS, []);

  // Handle Game Over and update session high score
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
    
    // Create new shot particle, launched straight up
    const newShot: Shot = {
      id: shotIdCounter.current++,
      x: CANVAS_WIDTH / 2,
      y: SHOOTER_Y,
      vx: 0,
      vy: -SHOT_SPEED,
      color: nextShotColorRef.current,
    };
    
    shotsRef.current = [...shotsRef.current, newShot];
    
    // Prepare next shot color (cycle through available colors)
    shooterColorIndexRef.current = (shooterColorIndexRef.current + 1) % COLORS.length;
    nextShotColorRef.current = COLORS[shooterColorIndexRef.current];
    
    // Slight difficulty increase per shot
    rotationSpeedRef.current *= 1.01; 

  }, [gameOver, gameStarted]);

  // Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      // 1. Clear and setup
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#1f2937'; // Grid background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // 2. Update Rotation
      rotationRef.current += rotationSpeedRef.current;
      
      // 3. Draw Wheel
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
      
      ctx.restore(); // Restore context to draw global elements

      // 4. Draw Shooter
      ctx.beginPath();
      ctx.rect(CANVAS_WIDTH / 2 - 20, SHOOTER_Y - 5, 40, 10);
      ctx.fillStyle = '#555';
      ctx.fill();
      
      // Draw next shot particle on the shooter
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, SHOOTER_Y, 8, 0, Math.PI * 2);
      ctx.fillStyle = nextShotColorRef.current;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      // 5. Update and Draw Shots
      const nextShots: Shot[] = [];
      shotsRef.current.forEach(shot => {
        shot.x += shot.vx;
        shot.y += shot.vy;
        
        // Draw shot
        ctx.beginPath();
        ctx.arc(shot.x, shot.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = shot.color;
        ctx.fill();
        
        // Collision Detection with Wheel
        const dx = shot.x - wheelCenter.x;
        const dy = shot.y - wheelCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= WHEEL_RADIUS) {
          // Calculate angle of impact relative to wheel center
          let impactAngle = Math.atan2(dy, dx) - rotationRef.current;
          
          // 1. Robustly normalize angle to [0, 2*PI)
          impactAngle = (impactAngle % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
          
          // 2. Add a tiny epsilon to ensure Math.floor doesn't fail near segment boundaries
          const epsilon = 1e-6;
          const segmentIndexRaw = (impactAngle + epsilon) / segmentAngle;
          
          // 3. Determine which segment was hit
          const segmentIndex = Math.floor(segmentIndexRaw);
          const segmentColor = COLORS[segmentIndex % COLORS.length];
          

          if (shot.color === segmentColor) {
            // SUCCESS!
            setScore(s => s + 1);
            setMessage('Perfect Match! +1');
          } else {
            // MISMATCH! Game Over
            // Log for debugging: console.log(`Mismatch: Shot ${shot.color}, Hit ${segmentColor} at index ${segmentIndex}`);
            handleGameOver(score);
          }
        } else if (shot.y > 0) {
          // If collision hasn't occurred and shot is still within boundary
          nextShots.push(shot);
        }
      });
      
      shotsRef.current = nextShots;

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, gameOver, segmentAngle, wheelCenter, handleGameOver, score]);

  // Input handler for Shooting
  const handleShooterClick = useCallback(() => {
    shootParticle();
  }, [shootParticle]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
        shootParticle();
    }
  }, [shootParticle]);

  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBack = () => {
    // Standard client-side navigation
    window.location.href = "/games"; 
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="fixed top-6 left-6 z-10">
            <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border px-3" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
            </Button>
        </div>
        
        <section className="w-full max-w-lg p-8 rounded-2xl shadow-xl bg-gray-50">
            <h1 className="text-3xl font-extrabold text-blue-800 mb-2 text-center">Color Orbit</h1>
            <p className="text-md text-gray-600 mb-4 text-center">Click (or press Space) to launch the colored ball into the matching segment of the spinning wheel.</p>
            
            <div className="w-full flex justify-between items-center mb-6 p-3 bg-white rounded-lg shadow-inner">
                <div className="text-xl font-bold text-gray-700">Score: <span className="text-green-600">{score}</span></div>
                <div className="text-xl font-bold text-gray-700">High Score (Session): <span className="text-purple-600">{sessionHighScore}</span></div>
            </div>

            {!gameStarted || gameOver ? (
                <div className="flex flex-col items-center justify-center flex-grow w-full min-h-[400px]">
                {gameOver && (
                    <div className="p-8 mb-6 w-full bg-red-100 border-2 border-red-400 rounded-xl shadow-lg text-center">
                    <p className="text-4xl font-extrabold text-red-700 mb-4">GAME OVER!</p>
                    <p className="text-xl font-semibold text-gray-800">{message}</p>
                    </div>
                )}
                <button 
                    onClick={resetGame} 
                    className="px-8 py-4 bg-blue-600 text-white text-2xl font-bold rounded-full shadow-lg transition duration-200 transform hover:scale-105 hover:bg-blue-700"
                >
                    {gameOver ? 'Play Again' : 'Start Orbit Shooter'}
                </button>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center">
                    <p className="text-md font-semibold text-gray-800 mb-4 h-6">{message}</p>
                    
                    <canvas 
                    ref={canvasRef} 
                    width={CANVAS_WIDTH} 
                    height={CANVAS_HEIGHT} 
                    className="border-4 border-gray-700 rounded-lg shadow-2xl bg-gray-900 cursor-pointer"
                    onClick={handleShooterClick}
                    />
                    <div className="mt-4 text-xs text-gray-500">
                        Rotation Speed: {(rotationSpeedRef.current / ROTATION_SPEED).toFixed(1)}x
                    </div>
                </div>
            )}
        </section>
    </div>
  );
};

export default OrbitGame;