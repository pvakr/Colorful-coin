"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from "next/navigation"
import { ArrowLeft, Play, RotateCcw, Zap, Target, Trophy, Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import GameWrapper from "@/components/GameWrapper";

type TileType = 'empty' | 'threat' | 'item' | 'boost';
type GameState = 'playing' | 'over' | 'win';

interface Position {
  x: number;
  y: number;
}

interface Tile {
  id: number;
  type: TileType;
}

const BOARD_SIZE = 12;
const MAX_BOOST_CHARGE = 100;
const BOOST_DRAIN_RATE = 2;
const BOOST_REFILL_AMOUNT = 30;
const GAME_TICK_INTERVAL_MS = 200;
const ITEMS_NEEDED_TO_WIN = 5;
const BOOST_TILES_COUNT = 5;
const THREAT_TILES_COUNT = 10;
const WINNING_SCORE = ITEMS_NEEDED_TO_WIN * 10;

const COLOR_MAP: Record<TileType, string> = {
  'empty': '#202020',
  'threat': '#FF4D4D',
  'item': '#4DFF4D',
  'boost': '#4D4DFF',
};

const DEUTERANOPIA_FILTER = 'grayscale(80%) sepia(50%) hue-rotate(30deg)';

const createBoard = (size: number): Tile[][] => {
  const board: Tile[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      id: y * size + x,
      type: 'empty',
    }))
  );

  const setTile = (x: number, y: number, type: TileType) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      board[y][x].type = type;
    }
  };

  const tilesToPlace: TileType[] = [
    ...Array(ITEMS_NEEDED_TO_WIN).fill('item'),
    ...Array(BOOST_TILES_COUNT).fill('boost'),
    ...Array(THREAT_TILES_COUNT).fill('threat'),
  ] as TileType[];
  
  for (let i = tilesToPlace.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tilesToPlace[i], tilesToPlace[j]] = [tilesToPlace[j], tilesToPlace[i]];
  }

  for (const type of tilesToPlace) {
    let x, y;
    do {
      x = Math.floor(Math.random() * size);
      y = Math.floor(Math.random() * size);
    } while (board[y][x].type !== 'empty' || (x === 0 && y === 0));
    setTile(x, y, type);
  }

  return board;
};

const App: React.FC = () => {
  const router = useRouter()
  const [board, setBoard] = useState<Tile[][]>(() => createBoard(BOARD_SIZE));
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [gameState, setGameState] = useState<GameState>('playing');
  const [score, setScore] = useState(0);
  const [boostCharge, setBoostCharge] = useState(MAX_BOOST_CHARGE);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [message, setMessage] = useState("Find the items (Green) and avoid the threats (Red)!");
  const [showGuide, setShowGuide] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameState !== 'playing') return;

    if (isBoostActive) {
      gameLoopRef.current = setInterval(() => {
        setBoostCharge(prev => {
          const newCharge = Math.max(0, prev - BOOST_DRAIN_RATE);
          if (newCharge === 0) {
            setIsBoostActive(false);
            setMessage("Boost depleted. Rely on non-color cues!");
          }
          return newCharge;
        });
      }, GAME_TICK_INTERVAL_MS);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, isBoostActive]);

  const checkInteraction = useCallback((newPos: Position) => {
    const tile = board[newPos.y][newPos.x];

    if (tile.type === 'threat') {
      setGameState('over');
      setMessage("GAME OVER! You stepped on a threat.");
      return false;
    }

    if (tile.type !== 'empty') {
      const newBoard = board.map(row => [...row]);
      
      switch (tile.type) {
        case 'item':
          setScore(s => s + 10);
          setMessage(`Item collected! Score +10.`);
          if (score + 10 >= WINNING_SCORE) {
             setGameState('win');
             setMessage("YOU WIN! Excellent chromatic navigation!");
          }
          break;
        case 'boost':
          setBoostCharge(c => Math.min(MAX_BOOST_CHARGE, c + BOOST_REFILL_AMOUNT));
          setMessage(`Boost refilled! +${BOOST_REFILL_AMOUNT} charge.`);
          break;
      }

      newBoard[newPos.y][newPos.x].type = 'empty';
      setBoard(newBoard);
    }

    setPlayerPos(newPos);
    return true;
  }, [board, score]);

  const handleMovement = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
      checkInteraction({ x: newX, y: newY });
    }
  }, [playerPos, gameState, checkInteraction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          handleMovement(0, -1);
          break;
        case 'ArrowDown':
          handleMovement(0, 1);
          break;
        case 'ArrowLeft':
          handleMovement(-1, 0);
          break;
        case 'ArrowRight':
          handleMovement(1, 0);
          break;
        case ' ':
        case 'b': 
          e.preventDefault();
          toggleBoost();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMovement]);
  
  const toggleBoost = () => {
    if (gameState !== 'playing') return;

    setIsBoostActive(prev => {
      const newState = !prev;
      if (newState) {
        if (boostCharge > 0) {
            setMessage("Chromatic Boost ACTIVE! Colors restored.");
            return true;
        } else {
            setMessage("Boost charge is empty! Collect blue tiles to recharge.");
            return false;
        }
      } else {
        setMessage("Boost INACTIVE. Vision is filtered.");
        return false;
      }
    });
  };

  const handleRestart = () => {
    setBoard(createBoard(BOARD_SIZE));
    setPlayerPos({ x: 0, y: 0 });
    setScore(0);
    setBoostCharge(MAX_BOOST_CHARGE);
    setIsBoostActive(false);
    setGameState('playing');
    setMessage("Find the items (Green) and avoid the threats (Red)!");
  };
   
  const handleBackToGames = () => {
    router.push("/games")
  };

  const boostProgress = (boostCharge / MAX_BOOST_CHARGE) * 100;
  
  const boardFilterStyle = {
      filter: isBoostActive ? 'none' : DEUTERANOPIA_FILTER,
  };

  const stats = [
    { label: "Score", value: score, icon: <Trophy className="w-4 h-4" /> },
    { label: "Boost", value: `${boostCharge}%`, icon: <Zap className="w-4 h-4" /> },
    { label: "Target", value: `${WINNING_SCORE}`, icon: <Target className="w-4 h-4" /> },
  ];

  const renderTile = (tile: Tile, x: number, y: number) => {
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const color = COLOR_MAP[tile.type];
    const nonColorCue = tile.type === 'threat' && !isBoostActive;
    
    return (
      <motion.div
        key={tile.id}
        className={`w-full h-full relative border border-gray-600 transition-colors duration-200`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          backgroundColor: color,
          backgroundImage: nonColorCue ? 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 1px, transparent 1px, transparent 5px)' : 'none',
        }}
      >
        {isPlayer && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center text-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            🚀
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <GameWrapper
      title="Chroma Drift"
      description="Navigate a color-blind world"
      stats={stats}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardContent className="p-6">
            {/* Message */}
            <motion.p 
              className={`text-center mb-4 font-semibold p-3 rounded-xl ${
                gameState === 'over' ? 'bg-red-500/20 text-red-300' : 
                gameState === 'win' ? 'bg-green-500/20 text-green-300' : 
                'bg-cyan-500/20 text-cyan-300'
              }`}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {message}
            </motion.p>

            {/* Boost Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Chromatic Boost
                </span>
                <span className={boostCharge > 20 ? 'text-green-400' : 'text-red-400'}>
                  {boostCharge}%
                </span>
              </div>
              <Progress value={boostProgress} className="h-3 bg-gray-700" />
            </div>

            {/* Game Board */}
            <motion.div 
              className="w-full mx-auto aspect-square transition-filter duration-300 rounded-xl overflow-hidden"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                ...boardFilterStyle
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {board.flatMap((row, y) => 
                row.map((tile, x) => renderTile(tile, x, y))
              )}
            </motion.div>
            
            {/* Controls */}
            <div className="mt-6 flex flex-col md:flex-row justify-center gap-3">
              <Button
                onClick={toggleBoost}
                disabled={gameState !== 'playing' || boostCharge === 0}
                className={`flex-1 ${
                  isBoostActive 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                {isBoostActive ? 'Deactivate' : 'Activate Boost'}
              </Button>
              <Button
                onClick={handleRestart}
                variant="outline"
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {gameState === 'playing' ? 'Reset' : 'New Game'}
              </Button>
            </div>
            
            {/* Movement Controls */}
            <div className="flex justify-center mt-4">
              <div className="grid grid-cols-3 gap-2 w-32 text-white">
                <div></div>
                <motion.button 
                  className="p-3 bg-white/10 rounded-lg hover:bg-white/20" 
                  onClick={() => handleMovement(0, -1)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronUp className="w-5 h-5 mx-auto" />
                </motion.button>
                <div></div>
                <motion.button 
                  className="p-3 bg-white/10 rounded-lg hover:bg-white/20" 
                  onClick={() => handleMovement(-1, 0)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-5 h-5 mx-auto" />
                </motion.button>
                <motion.button 
                  className="p-3 bg-white/10 rounded-lg hover:bg-white/20" 
                  onClick={toggleBoost}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Zap className="w-5 h-5 mx-auto" />
                </motion.button>
                <motion.button 
                  className="p-3 bg-white/10 rounded-lg hover:bg-white/20" 
                  onClick={() => handleMovement(1, 0)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-5 h-5 mx-auto" />
                </motion.button>
                <div></div>
                <motion.button 
                  className="p-3 bg-white/10 rounded-lg hover:bg-white/20" 
                  onClick={() => handleMovement(0, 1)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronDown className="w-5 h-5 mx-auto" />
                </motion.button>
                <div></div>
              </div>
            </div>
            
            {/* Guide */}
            <Collapsible open={showGuide} onOpenChange={setShowGuide}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-white/80 hover:bg-white/10 mt-4">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Game Guide
                  </span>
                  <motion.div
                    animate={{ rotate: showGuide ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▼
                  </motion.div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 p-4 bg-white/5 rounded-xl space-y-3 text-sm text-white/70">
                <p>
                  <strong className="text-yellow-400">The Handicap:</strong> The game board is visually filtered, making 
                  <span className="text-red-400"> Threats (Red)</span> and 
                  <span className="text-green-400"> Safe Items (Green)</span> appear nearly identical.
                </p>
                <p>
                  <strong className="text-cyan-400">The Goal:</strong> Collect items to score {WINNING_SCORE} points, avoid threats, and use 
                  <span className="text-blue-400"> Blue boost refills</span> to recharge.
                </p>
                <p>
                  <strong className="text-purple-400">Chromatic Boost (Space/B):</strong> Activating the boost temporarily removes the color filter. Use it sparingly!
                </p>
                <p>
                  <strong className="text-white/90">Strategy:</strong> When boost is off, look for the faint diagonal line pattern on threats.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </motion.div>

      {/* Game Over Dialog */}
      <Dialog open={gameState === 'over' || gameState === 'win'} onOpenChange={() => {}}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-2xl ${gameState === 'win' ? 'text-green-400' : 'text-red-400'}`}>
              {gameState === 'win' ? (
                <><Trophy className="w-8 h-8" /> MISSION COMPLETE</>
              ) : (
                <><RotateCcw className="w-8 h-8" /> DRIFT FAILED</>
              )}
            </DialogTitle>
            <DialogDescription className="text-lg text-white/80">
              {message}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <span className="text-white/60">Final Score</span>
            <motion.div 
              className="text-5xl font-bold text-yellow-400 mt-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              {score}
            </motion.div>
          </div>
          <DialogFooter>
            <Button onClick={handleRestart} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">
              <Play className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GameWrapper>
  );
};

export default App;
