"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Constants ---
const GAME_ID = 'color_negative';
const STIMULUS_TIME = 8; // Seconds to stare at the negative image
const NUM_SHAPES = 4;

interface Shape {
  originalHex: string; // The color the user needs to recall
  negativeHex: string; // The color displayed during stimulation
  position: 'TL' | 'TR' | 'BL' | 'BR'; // Top-Left, Top-Right, etc.
}

// Highly distinct primary/secondary colors for strong afterimages
const BASE_COLORS = [
    '#FF0000', // Red
    '#0000FF', // Blue
    '#00FF00', // Green
    '#FFFF00', // Yellow
];
const POSITIONS = ['TL', 'TR', 'BL', 'BR'];

// --- Helper Functions ---

// Converts hex to RGB array
const hexToRgb = (hex: string): number[] => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
};

// Converts RGB array to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  const componentToHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
};

// Calculates the complementary color (Negative)
const getNegativeColor = (hex: string): string => {
  const [r, g, b] = hexToRgb(hex);
  // Complementary color is calculated by (255 - component)
  return rgbToHex(255 - r, 255 - g, 255 - b);
};


// --- Main Game Component ---

const AfterimageGame = () => {
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [stimulusTimeLeft, setStimulusTimeLeft] = useState<number>(STIMULUS_TIME);
  const [phase, setPhase] = useState<'intro' | 'stimulus' | 'recall' | 'score'>('intro');
  const [answers, setAnswers] = useState<string[]>([]); // User's chosen hex colors for recall
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState('Stare at the center cross during the stimulation phase.');
  
  // Cache the possible options for the current round
  const recallOptions = useMemo(() => {
    // Dynamically derive the set of options from the actual shapes used in the round
    const optionsSet = new Set(shapes.map(s => s.originalHex));
    // Also include any unused BASE_COLORS as distractors if we had more than 4,
    // but for now, we just ensure they are sorted for consistent button display.
    return Array.from(optionsSet).sort();
  }, [shapes]);

  // 1. Initial Setup
  useEffect(() => {
    setMessage('Stare intently at the cross during the stimulation phase.');
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setPhase('score');
    setSessionHighScore(prevScore => Math.max(prevScore, finalScore));
  }, []);
  
  const generateStimulus = useCallback(() => {
    // Since NUM_SHAPES == BASE_COLORS.length, we use all of them.
    const shuffledColors = [...BASE_COLORS].sort(() => Math.random() - 0.5);
    const shuffledPositions = [...POSITIONS].sort(() => Math.random() - 0.5);
    
    const newShapes = shuffledColors.slice(0, NUM_SHAPES).map((originalHex, index) => ({
      originalHex,
      negativeHex: getNegativeColor(originalHex),
      position: shuffledPositions[index] as Shape['position'],
    }));
    
    setShapes(newShapes);
    setAnswers(Array(NUM_SHAPES).fill(''));
    setStimulusTimeLeft(STIMULUS_TIME);
    setScore(0);
    setPhase('stimulus');
  }, []);

  // 2. Stimulus Timer Effect
  useEffect(() => {
    if (phase !== 'stimulus') return;

    const interval = setInterval(() => {
      setStimulusTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          setPhase('recall');
          setMessage('RECALL! Click the original colors.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);
  
  // 3. Dynamic Message Effect (Update based on phase/time)
  useEffect(() => {
      if (phase === 'stimulus') {
          setMessage(`STIMULUS: ${stimulusTimeLeft}s remaining. Do not blink!`);
      } else if (phase === 'recall') {
          setMessage('RECALL! Match the afterimages to the original colors.');
      } else if (phase === 'intro') {
          setMessage('Stare intently at the cross during the stimulation phase.');
      }
  }, [phase, stimulusTimeLeft]);


  const handleRecallClick = (position: Shape['position'], color: string) => {
    if (phase !== 'recall') return;

    // Find the shape based on position
    const shapeIndex = shapes.findIndex(s => s.position === position);
    if (shapeIndex === -1) return;

    // Record the user's choice
    const newAnswers = [...answers];
    newAnswers[shapeIndex] = color;
    setAnswers(newAnswers);

    // Check if all answers are provided
    if (newAnswers.filter(a => a !== '').length === NUM_SHAPES) {
      processFinalScore(newAnswers);
    }
  };
  
  const processFinalScore = (finalAnswers: string[]) => {
    let finalScore = 0;
    shapes.forEach((shape, index) => {
      if (shape.originalHex === finalAnswers[index]) {
        finalScore++;
      }
    });
    setScore(finalScore);
    handleGameOver(finalScore);
  };
  
  const startGame = () => {
    generateStimulus();
  };

  const resetGame = () => {
    setPhase('intro');
    setShapes([]);
    setAnswers([]);
    setScore(0);
  };
  
  const handleBack = () => {
    // Standard client-side navigation
    window.location.href = "/games"; 
  };
  
  
  const getPositionClasses = (pos: Shape['position']) => {
      const base = "absolute w-1/2 h-1/2 flex items-center justify-center p-4";
      switch(pos) {
          case 'TL': return `${base} top-0 left-0`;
          case 'TR': return `${base} top-0 right-0`;
          case 'BL': return `${base} bottom-0 left-0`;
          case 'BR': return `${base} bottom-0 right-0`;
      }
  }

  // RENDER HELPER FUNCTION (REPLACED USEMEMO)
  const renderRecallBoard = () => {
      if (phase !== 'recall' || recallOptions.length === 0) return null;
      
      return (
          <div className="flex flex-col items-center">
              <div className="w-full text-center text-xl font-bold text-gray-800 mb-4">
                  Match the original color to the position you stared at!
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                  {shapes.map((shape, index) => (
                      <div key={shape.position} className="p-4 rounded-xl shadow-lg border-2 border-gray-300">
                          <p className="font-bold text-lg mb-2 text-center text-gray-700">{shape.position}</p>
                          <div className="flex justify-center space-x-2">
                              {/* Displaying options derived dynamically from the current round's shapes */}
                              {recallOptions.map(color => (
                                  <button
                                      key={color}
                                      onClick={() => handleRecallClick(shape.position, color)}
                                      className={`w-10 h-10 rounded-full transition-all duration-150 ${
                                          answers[index] === color ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:ring-2 ring-gray-400'
                                      }`}
                                      style={{ backgroundColor: color }}
                                  ></button>
                              ))}
                          </div>
                          {answers[index] && <div className="mt-2 text-center text-sm font-mono" style={{color: answers[index]}}>Chosen: {answers[index]}</div>}
                      </div>
                  ))}
              </div>
          </div>
      );
  };
  // END RENDER HELPER FUNCTION


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="fixed top-6 left-6 z-10">
            <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white border px-3" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
            </Button>
        </div>
        
        <section className="w-full max-w-lg p-8 rounded-2xl shadow-xl bg-gray-50">
            <h1 className="text-3xl font-extrabold text-blue-800 mb-2 text-center">Color Negative</h1>
            <p className="text-md text-gray-600 mb-4 text-center">Test your retinal memory by recalling the true colors after viewing their negative complements.</p>
            
            <div className="w-full flex justify-between items-center mb-6 p-3 bg-white rounded-lg shadow-inner">
                <div className="text-xl font-bold text-gray-700">Last Score: <span className="text-green-600">{score} / {NUM_SHAPES}</span></div>
                <div className="text-xl font-bold text-gray-700">High Score (Session): <span className="text-purple-600">{sessionHighScore} / {NUM_SHAPES}</span></div>
            </div>
            
            {/* Game Stages */}
            {phase === 'intro' && (
                <div className="flex flex-col items-center justify-center flex-grow w-full min-h-[400px] text-center">
                    <p className="text-xl text-gray-700 mb-8">
                        Stare intently at the cross in the center. Your score is the number of colors you correctly identify.
                    </p>
                    <button 
                        onClick={startGame} 
                        className="px-8 py-4 bg-blue-600 text-white text-2xl font-bold rounded-full shadow-lg transition duration-200 transform hover:scale-105 hover:bg-blue-700"
                    >
                        Start Afterimage Test
                    </button>
                </div>
            )}

            {(phase === 'stimulus' || phase === 'recall') && (
                <div className="w-full flex flex-col items-center">
                    <p className={`text-2xl font-bold mb-4 ${phase === 'stimulus' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
                    
                    <div 
                        className={`relative border-4 border-gray-700 shadow-2xl transition-all duration-1000 ${phase === 'recall' ? 'bg-gray-300' : 'bg-white'}`}
                        style={{ width: 400, height: 400 }}
                    >
                        {/* Shapes visible only during stimulation phase */}
                        {phase === 'stimulus' && shapes.map(shape => (
                            <div 
                                key={shape.position} 
                                className={getPositionClasses(shape.position)}
                                style={{ backgroundColor: shape.negativeHex }}
                            >
                                {/* Central Fixation Cross */}
                                <div className="absolute w-4 h-4 bg-black rounded-full z-10"></div>
                                <div className="absolute w-1 h-10 bg-black z-10"></div>
                                <div className="absolute h-1 w-10 bg-black z-10"></div>
                            </div>
                        ))}
                        
                        {/* Central Fixation Cross for Recall Phase (to focus on blank screen) */}
                        {phase === 'recall' && (
                            <>
                                <div className="absolute w-4 h-4 bg-black rounded-full z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute w-1 h-10 bg-black z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute h-1 w-10 bg-black z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                            </>
                        )}
                    </div>
                    
                    {renderRecallBoard()}
                    
                </div>
            )}
            
            {phase === 'score' && (
                <div className="p-8 w-full bg-green-100 border-2 border-green-400 rounded-xl shadow-lg text-center min-h-[400px]">
                    <p className="text-4xl font-extrabold text-green-700 mb-4">Round Complete!</p>
                    <p className="text-xl font-semibold text-gray-800">Your Score: <span className="text-purple-600">{score} / {NUM_SHAPES}</span></p>
                    
                    <div className="mt-6 text-left">
                        <h3 className="text-lg font-bold text-gray-700 border-b pb-1 mb-2">Results:</h3>
                        {shapes.map((shape, index) => (
                            <div key={shape.position} className="flex justify-between items-center py-1">
                                <span className="font-bold">{shape.position}</span>
                                <span className="text-sm font-mono">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2`} style={{backgroundColor: shape.originalHex}}></span>
                                    {shape.originalHex}
                                </span>
                                <span className={`font-extrabold ${answers[index] === shape.originalHex ? 'text-green-500' : 'text-red-500'}`}>
                                    {answers[index] === shape.originalHex ? 'CORRECT' : 'INCORRECT'}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={resetGame} className="mt-8 px-6 py-2 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition duration-200">
                        Return to Intro
                    </button>
                </div>
            )}
        </section>
    </div>
  );
};

export default AfterimageGame;