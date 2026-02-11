"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import GameWrapper from "@/components/GameWrapper";
import { Trophy, Eye, Zap } from "lucide-react";
import { motion } from "framer-motion";

const STIMULUS_TIME = 8;
const NUM_SHAPES = 4;

interface Shape {
  originalHex: string;
  negativeHex: string;
  position: 'TL' | 'TR' | 'BL' | 'BR';
}

const BASE_COLORS = [
  '#FF0000',
  '#0000FF',
  '#00FF00',
  '#FFFF00',
];
const POSITIONS = ['TL', 'TR', 'BL', 'BR'];

const hexToRgb = (hex: string): number[] => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const componentToHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
};

const getNegativeColor = (hex: string): string => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(255 - r, 255 - g, 255 - b);
};

const AfterimageGame = () => {
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [stimulusTimeLeft, setStimulusTimeLeft] = useState<number>(STIMULUS_TIME);
  const [phase, setPhase] = useState<'intro' | 'stimulus' | 'recall' | 'score'>('intro');
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState('Stare at the center cross during the stimulation phase.');

  const recallOptions = useMemo(() => {
    const optionsSet = new Set(shapes.map(s => s.originalHex));
    return Array.from(optionsSet).sort();
  }, [shapes]);

  useEffect(() => {
    setMessage('Stare intently at the cross during the stimulation phase.');
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setPhase('score');
    setSessionHighScore(prevScore => Math.max(prevScore, finalScore));
  }, []);

  const generateStimulus = useCallback(() => {
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

    const shapeIndex = shapes.findIndex(s => s.position === position);
    if (shapeIndex === -1) return;

    const newAnswers = [...answers];
    newAnswers[shapeIndex] = color;
    setAnswers(newAnswers);

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

  const getPositionClasses = (pos: Shape['position']) => {
    const base = "absolute w-1/2 h-1/2 flex items-center justify-center p-4";
    switch(pos) {
      case 'TL': return `${base} top-0 left-0`;
      case 'TR': return `${base} top-0 right-0`;
      case 'BL': return `${base} bottom-0 left-0`;
      case 'BR': return `${base} bottom-0 right-0`;
    }
  };

  return (
    <GameWrapper
      title="Color Negative"
      description="Test your retinal memory by recalling the true colors"
      stats={[
        { label: "Score", value: `${score} / ${NUM_SHAPES}`, icon: <Trophy className="w-4 h-4" /> },
        { label: "High Score", value: `${sessionHighScore} / ${NUM_SHAPES}`, icon: <Eye className="w-4 h-4" /> },
      ]}
    >
      <div className="w-full max-w-lg">
        {phase === 'intro' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center w-full min-h-[400px] text-center"
          >
            <p className="text-xl text-white/80 mb-8">
              Stare intently at the cross in the center. Your score is the number of colors you correctly identify.
            </p>
            <Button
              onClick={startGame}
              className="bg-white text-black hover:bg-gray-200 shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Afterimage Test
            </Button>
          </motion.div>
        )}

        {(phase === 'stimulus' || phase === 'recall') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center"
          >
            <p className={`text-xl font-bold mb-4 ${phase === 'stimulus' ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>

            <motion.div
              className={`relative border-4 border-white/20 shadow-2xl transition-all duration-1000`}
              style={{ width: 300, height: 300 }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {phase === 'stimulus' && shapes.map(shape => (
                <div
                  key={shape.position}
                  className={getPositionClasses(shape.position)}
                  style={{ backgroundColor: shape.negativeHex }}
                >
                  <div className="absolute w-4 h-4 bg-black rounded-full z-10" />
                  <div className="absolute w-1 h-10 bg-black z-10" />
                  <div className="absolute h-1 w-10 bg-black z-10" />
                </div>
              ))}

              {phase === 'recall' && (
                <>
                  <div className="absolute w-4 h-4 bg-black rounded-full z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute w-1 h-10 bg-black z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute h-1 w-10 bg-black z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </>
              )}
            </motion.div>

            {phase === 'recall' && (
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {shapes.map((shape, index) => (
                  <motion.div
                    key={shape.position}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20"
                  >
                    <p className="font-bold text-lg mb-2 text-center text-white">{shape.position}</p>
                    <div className="flex justify-center space-x-2">
                      {recallOptions.map(color => (
                        <motion.button
                          key={color}
                          onClick={() => handleRecallClick(shape.position, color)}
                          className={`w-10 h-10 rounded-full transition-all duration-150 ${
                            answers[index] === color ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:ring-2 ring-white/40'
                          }`}
                          style={{ backgroundColor: color }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        />
                      ))}
                    </div>
                    {answers[index] && (
                      <div className="mt-2 text-center text-sm font-mono text-white">
                        {answers[index]}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {phase === 'score' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-8 w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl shadow-lg text-center"
          >
            <p className="text-3xl font-bold text-white mb-4">Round Complete!</p>
            <p className="text-xl text-white/80 mb-6">
              Your Score: <span className="text-yellow-400 font-bold">{score} / {NUM_SHAPES}</span>
            </p>

            <div className="mt-6 text-left space-y-3">
              <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2 mb-4">Results:</h3>
              {shapes.map((shape, index) => (
                <motion.div
                  key={shape.position}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex justify-between items-center py-2 px-4 bg-white/5 rounded-lg"
                >
                  <span className="font-bold text-white">{shape.position}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white/70">{shape.originalHex}</span>
                    <span className={`font-bold ${answers[index] === shape.originalHex ? 'text-green-400' : 'text-red-400'}`}>
                      {answers[index] === shape.originalHex ? '✓' : '✗'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={resetGame}
              className="mt-8 bg-white text-black hover:bg-gray-200"
            >
              Return to Intro
            </Button>
          </motion.div>
        )}
      </div>
    </GameWrapper>
  );
};

export default AfterimageGame;
