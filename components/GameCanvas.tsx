// components/GameCanvas.tsx
'use client'; 

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter, { IEventCollision, Engine, World, Body, Composite } from 'matter-js'; 
import * as PIXI from 'pixi.js';

// --- Configuration ---
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

// Color progression map for merging
const COLOR_MAP = {
  1: { color: 0xFF00FF, radius: 25 }, // Magenta (Level 1)
  2: { color: 0xFF4500, radius: 35 }, // Red/Orange (Level 2)
  3: { color: 0xADFF2F, radius: 45 }, // Green/Yellow (Level 3)
  4: { color: 0x00BFFF, radius: 55 }, // Deep Sky Blue (Level 4)
};
const LEVEL_KEYS = Object.keys(COLOR_MAP);
const MAX_LEVEL = LEVEL_KEYS.length;

// --- Helper to Create a Game Piece ---
function createBlob(x: number, y: number, level: number) {
  const settings = COLOR_MAP[level as keyof typeof COLOR_MAP];
  
  if (!settings) return null;

  // 1. Create the Physics Body (Matter.js)
  const body = Matter.Bodies.circle(x, y, settings.radius, {
    restitution: 0.8,
    label: `level_${level}`,
    frictionAir: 0.05,
    mass: settings.radius * 0.5,
  });

  // 2. Create the Graphics Object (PixiJS)
  const graphics = new PIXI.Graphics();
  graphics.beginFill(settings.color);
  // NOTE: This is the insertion point for your custom shaders!
  graphics.drawCircle(0, 0, settings.radius);
  graphics.endFill();
  
  // Custom properties to link physics to graphics and game state
  (body as any).graphics = graphics; 
  (body as any).level = level;

  return body;
}


// --- Main Client Component ---
const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  
  const isInitializedRef = useRef(false); 

  const [nextPieceLevel, setNextPieceLevel] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to drop a new piece into the game area
  const dropNewPiece = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!engineRef.current || !pixiAppRef.current || !isInitialized) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const dropX = Math.min(Math.max(e.clientX - rect.left, 50), GAME_WIDTH - 50); 
    const dropY = 50; 

    const newBlob = createBlob(dropX, dropY, nextPieceLevel);
    
    if (newBlob) {
      World.add(engineRef.current.world, newBlob);
      pixiAppRef.current.stage.addChild((newBlob as any).graphics);
      
      const nextLevel = Math.floor(Math.random() * 2) + 1;
      setNextPieceLevel(nextLevel); 
    }
  }, [nextPieceLevel, isInitialized]);

  // --- Core Game Initialization Effect ---
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) {
        return; 
    }

    // --- Physics Setup ---
    const engine = Engine.create();
    engine.gravity.y = 0.5;
    engineRef.current = engine;
    
    // --- Renderer Setup (Final Error Fix Applied Here) ---
    let app: PIXI.Application; // Declare 'app' so it can be used below

    try {
        app = new PIXI.Application({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: 0xE0E0E0, 
            antialias: true,
            resolution: window.devicePixelRatio || 1,
        });
        pixiAppRef.current = app;

        // Safely append the view to the DOM element
        if (app.view instanceof HTMLCanvasElement) {
            containerRef.current.appendChild(app.view);
        } else if (app.view) {
            containerRef.current.appendChild(app.view as unknown as Node);
        }

        // Set initialization flags
        isInitializedRef.current = true;
        setIsInitialized(true); 

    } catch (e) {
        console.error("PIXI initialization failed, stopping useEffect execution:", e);
        return; 
    }

    // Guard against a failed initialization
    if (!app) return; 

    // --- Boundaries ---
    const walls = [
      Body.create({ isStatic: true, position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT + 10 }, label: 'Wall' }),
      Body.create({ isStatic: true, position: { x: -10, y: GAME_HEIGHT / 2 }, label: 'Wall' }),
      Body.create({ isStatic: true, position: { x: GAME_WIDTH + 10, y: GAME_HEIGHT / 2 }, label: 'Wall' }),
    ];
    World.add(engine.world, walls);
    
    // --- MERGE LOGIC: Collision Handler ---
    Matter.Events.on(engine, 'collisionStart', (event: IEventCollision<Engine>) => {
      const pairs = event.pairs;
      
      pairs.forEach(pair => {
        const bodyA = pair.bodyA as Body & { level: number; graphics: PIXI.Graphics };
        const bodyB = pair.bodyB as Body & { level: number; graphics: PIXI.Graphics };
        
        if (!bodyA.level || !bodyB.level) return;

        if (bodyA.level === bodyB.level) {
          const currentLevel = bodyA.level;
          const newLevel = currentLevel + 1;
          const settings = COLOR_MAP[newLevel as keyof typeof COLOR_MAP];

          if (settings && newLevel <= MAX_LEVEL) {
            const newX = (bodyA.position.x + bodyB.position.x) / 2;
            const newY = (bodyA.position.y + bodyB.position.y) / 2;

            World.remove(engine.world, [bodyA, bodyB]);
            app.stage.removeChild(bodyA.graphics);
            app.stage.removeChild(bodyB.graphics);

            const newBlob = createBlob(newX, newY, newLevel);
            if (newBlob) {
              World.add(engine.world, newBlob);
              app.stage.addChild((newBlob as any).graphics);
            }
          }
        }
      });
    });

    // --- THE GAME LOOP (Physics & Rendering Sync) ---
    const gameLoop = () => {
      Engine.update(engine, 1000 / 60);

      Composite.allBodies(engine.world).forEach((body) => {
        const graphics = (body as any).graphics;
        if (graphics) {
          graphics.position.set(body.position.x, body.position.y);
          graphics.rotation = body.angle;
        }
      });
      
      app.renderer.render(app.stage);
      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
    
    // --- Cleanup ---
    return () => {
      Matter.Engine.clear(engine);
      isInitializedRef.current = false;
      if (app) {
         app.destroy(true, true); 
      }
    };
  }, []); 

  // --- Rendered Component UI ---
  return (
    <div 
      ref={containerRef} 
      onClick={dropNewPiece}
      className="border-4 border-yellow-500 rounded-lg overflow-hidden shadow-2xl cursor-pointer relative"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
    >
      {/* Next Piece Indicator */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 p-1 rounded-b-lg text-white font-bold text-sm z-10 text-center"
        style={{ 
            backgroundColor: `#${COLOR_MAP[nextPieceLevel as keyof typeof COLOR_MAP]?.color.toString(16).padStart(6, '0') || '000000'}`,
            width: `${COLOR_MAP[nextPieceLevel as keyof typeof COLOR_MAP]?.radius * 2}px`,
            border: '2px solid white'
        }}
      >
        NEXT
      </div>
    </div>
  );
};

export default GameCanvas;