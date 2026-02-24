/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Timer, 
  RefreshCw, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Eye
} from 'lucide-react';

// --- Types ---

interface Color {
  h: number;
  s: number;
  l: number;
}

interface GameState {
  status: 'idle' | 'playing' | 'gameover';
  score: number;
  level: number;
  timeLeft: number;
  gridSize: number;
  baseColor: Color;
  targetColor: Color;
  targetIndex: number;
}

// --- Constants ---

const INITIAL_TIME = 30;
const GRID_SIZE = 5; // Fixed 5x5 as requested
const BASE_DIFFERENCE = 15; // Initial L difference percentage
const MIN_DIFFERENCE = 1.5; // Minimum L difference percentage

// --- Utilities ---

const generateRandomColor = (): Color => ({
  h: Math.floor(Math.random() * 360),
  s: 50 + Math.floor(Math.random() * 40), // 50-90%
  l: 40 + Math.floor(Math.random() * 20), // 40-60%
});

const colorToCss = (color: Color): string => 
  `hsl(${color.h}, ${color.s}%, ${color.l}%)`;

const getDifficultyDifference = (level: number): number => {
  // Exponential decay for difficulty
  return Math.max(MIN_DIFFERENCE, BASE_DIFFERENCE * Math.pow(0.92, level));
};

// --- Components ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    level: 0,
    timeLeft: INITIAL_TIME,
    gridSize: GRID_SIZE,
    baseColor: { h: 0, s: 0, l: 0 },
    targetColor: { h: 0, s: 0, l: 0 },
    targetIndex: -1,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateLevel = useCallback((currentLevel: number) => {
    const base = generateRandomColor();
    const diff = getDifficultyDifference(currentLevel);
    
    // Randomly decide if we change lightness or saturation for more variety
    const mode = Math.random() > 0.5 ? 'l' : 's';
    const target = { ...base };
    
    if (mode === 'l') {
      // Ensure we don't go out of bounds
      const direction = base.l > 50 ? -1 : 1;
      target.l = base.l + (direction * diff);
    } else {
      const direction = base.s > 50 ? -1 : 1;
      target.s = base.s + (direction * diff);
    }

    const targetIndex = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));

    setGameState(prev => ({
      ...prev,
      level: currentLevel,
      baseColor: base,
      targetColor: target,
      targetIndex,
    }));
  }, []);

  const startGame = () => {
    setGameState({
      status: 'playing',
      score: 0,
      level: 0,
      timeLeft: INITIAL_TIME,
      gridSize: GRID_SIZE,
      baseColor: { h: 0, s: 0, l: 0 },
      targetColor: { h: 0, s: 0, l: 0 },
      targetIndex: -1,
    });
    generateLevel(0);
  };

  const handleBlockClick = (index: number) => {
    if (gameState.status !== 'playing') return;

    if (index === gameState.targetIndex) {
      // Correct!
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        timeLeft: Math.min(INITIAL_TIME, prev.timeLeft + 2), // Bonus time
      }));
      generateLevel(gameState.level + 1);
    } else {
      // Wrong! Penalty
      setGameState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 3),
      }));
    }
  };

  useEffect(() => {
    if (gameState.status === 'playing') {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return { ...prev, status: 'gameover', timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 0.1 };
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.status]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-neutral-50">
      {/* Header */}
      <header className="w-full max-w-md mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-black rounded-lg text-white">
              <Eye size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Chroma Vision</h1>
          </div>
          <button 
            onClick={() => setGameState(prev => ({ ...prev, status: 'idle' }))}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <Info size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Score</p>
              <p className="text-xl font-bold tabular-nums">{gameState.score}</p>
            </div>
          </div>
          <div className={`bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-3 transition-colors ${gameState.timeLeft < 5 ? 'border-red-200 bg-red-50' : ''}`}>
            <div className={`p-2 rounded-lg ${gameState.timeLeft < 5 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <Timer size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Time</p>
              <p className={`text-xl font-bold tabular-nums ${gameState.timeLeft < 5 ? 'text-red-600' : ''}`}>
                {gameState.timeLeft.toFixed(1)}s
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Game Area */}
      <main className="w-full max-w-md relative">
        <AnimatePresence mode="wait">
          {gameState.status === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden bg-white p-8 rounded-3xl shadow-2xl border border-neutral-200 text-center"
            >
              {/* Vibrant Background Accents */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Eye size={48} className="text-white" />
                </div>
                
                <h2 className="text-3xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-600">
                  色彩敏感度挑战
                </h2>
                
                <p className="text-neutral-600 mb-10 leading-relaxed max-w-[280px] mx-auto">
                  在 5x5 的色块矩阵中，找出那个颜色略有不同的色块。
                  <span className="block mt-2 font-medium text-neutral-400 italic">专业艺术生色彩训练工具</span>
                </p>
                
                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  开始挑战 
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="mt-8 flex justify-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: `hsl(${i * 45 + 200}, 70%, 60%)`,
                        animation: `pulse-subtle 2s infinite ${i * 0.2}s`
                      }} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {gameState.status === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid-container grid grid-cols-5 gap-2 md:gap-3 bg-white p-3 md:p-4 rounded-3xl shadow-xl border border-neutral-200"
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                <motion.button
                  key={`${gameState.level}-${i}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleBlockClick(i)}
                  className="w-full h-full rounded-xl md:rounded-2xl transition-shadow hover:shadow-lg cursor-pointer"
                  style={{ 
                    backgroundColor: i === gameState.targetIndex 
                      ? colorToCss(gameState.targetColor) 
                      : colorToCss(gameState.baseColor) 
                  }}
                />
              ))}
            </motion.div>
          )}

          {gameState.status === 'gameover' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl border border-neutral-200 text-center"
            >
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={40} className="text-amber-500" />
              </div>
              <h2 className="text-3xl font-bold mb-1">时间到！</h2>
              <p className="text-neutral-500 mb-6">你的最终得分</p>
              
              <div className="text-6xl font-black mb-8 tracking-tighter">
                {gameState.score}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-neutral-50 p-4 rounded-2xl">
                  <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Level</p>
                  <p className="text-xl font-bold">{gameState.level}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl">
                  <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Accuracy</p>
                  <p className="text-xl font-bold">
                    {gameState.level > 0 ? Math.round((gameState.score / gameState.level) * 100) : 0}%
                  </p>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-neutral-800 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                再试一次 <RefreshCw size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Info */}
      <footer className="w-full max-w-md mt-12">
        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-neutral-200">
          <div className="flex items-center gap-2 mb-4 text-neutral-600">
            <AlertCircle size={18} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">色彩差异说明</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-sm text-neutral-600 leading-snug">
                <span className="font-bold text-neutral-900">核心挑战：</span>
                差异色块可能在 <span className="italic">亮度 (Lightness)</span> 或 <span className="italic">饱和度 (Saturation)</span> 上有细微变化。
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600">
                <Info size={16} />
              </div>
              <p className="text-sm text-neutral-600 leading-snug">
                <span className="font-bold text-neutral-900">难度曲线：</span>
                初始差异约为 15%，随着得分增加，差异会指数级缩小至 1.5% 左右。
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-[10px] text-center text-neutral-400 font-mono uppercase tracking-[0.2em]">
              Designed for Art Professionals & Students
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
