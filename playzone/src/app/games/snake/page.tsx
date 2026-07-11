"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdBanner from "@/components/AdBanner";
import ShareButtons from "@/components/ShareButtons";
import { addScore } from "@/lib/leaderboard";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showSaveScore, setShowSaveScore] = useState(false);
  const [playerName, setPlayerName] = useState("");

  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem("snake_highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initial = [{ x: 10, y: 10 }];
    setSnake(initial);
    setFood(spawnFood(initial));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setPaused(false);
    setShowSaveScore(false);
  }, [spawnFood]);

  const gameLoop = useCallback(() => {
    setSnake((prev) => {
      const head = { ...prev[0] };
      const dir = directionRef.current;

      if (dir === "UP") head.y -= 1;
      if (dir === "DOWN") head.y += 1;
      if (dir === "LEFT") head.x -= 1;
      if (dir === "RIGHT") head.x += 1;

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setStarted(false);
        setShowSaveScore(true);
        return prev;
      }

      if (prev.some((s) => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        setStarted(false);
        setShowSaveScore(true);
        return prev;
      }

      const newSnake = [head, ...prev];

      setFood((currentFood) => {
        if (head.x === currentFood.x && head.y === currentFood.y) {
          setScore((s) => {
            const newScore = s + 10;
            setHighScore((hs) => {
              if (newScore > hs) {
                localStorage.setItem("snake_highscore", String(newScore));
                return newScore;
              }
              return hs;
            });
            return newScore;
          });
          const spawned = spawnFood(newSnake);
          return spawned;
        }
        newSnake.pop();
        return currentFood;
      });

      return newSnake;
    });
  }, [spawnFood]);

  useEffect(() => {
    if (started && !paused && !gameOver) {
      const speed = Math.max(60, INITIAL_SPEED - score);
      gameLoopRef.current = setInterval(gameLoop, speed);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [started, paused, gameOver, gameLoop, score]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " && started) {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }

      const keyMap: Record<string, Direction> = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      };

      const newDir = keyMap[e.key];
      if (!newDir) return;

      e.preventDefault();

      const opposites: Record<Direction, Direction> = {
        UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
      };

      if (opposites[newDir] !== directionRef.current) {
        directionRef.current = newDir;
        setDirection(newDir);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started]);

  const handleSaveScore = () => {
    if (playerName.trim() && score > 0) {
      addScore({ name: playerName.trim(), score, game: "Snake" });
      setShowSaveScore(false);
    }
  };

  const handleMobileDirection = (dir: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
    };
    if (opposites[dir] !== directionRef.current) {
      directionRef.current = dir;
      setDirection(dir);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">🐍 Snake Game</h1>
        <p className="text-slate-500 dark:text-slate-400">Use arrow keys or WASD to move. Space to pause.</p>
      </div>

      <AdBanner slot="snake-top" format="horizontal" className="mb-6" />

      <div className="flex justify-center gap-8 mb-4 text-lg font-semibold">
        <span>Score: <span className="text-indigo-600">{score}</span></span>
        <span>Best: <span className="text-amber-500">{highScore}</span></span>
      </div>

      <div className="flex justify-center mb-6">
        <div
          className="relative border-2 border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-900"
          style={{ width: GRID_SIZE * 20, height: GRID_SIZE * 20 }}
        >
          {snake.map((segment, i) => (
            <div
              key={i}
              className={`absolute rounded-sm ${i === 0 ? "bg-green-400" : "bg-green-500"}`}
              style={{
                left: segment.x * 20,
                top: segment.y * 20,
                width: 18,
                height: 18,
                margin: 1,
              }}
            />
          ))}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: food.x * 20 + 2,
              top: food.y * 20 + 2,
              width: 16,
              height: 16,
            }}
          />

          {!started && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-lg transition-colors"
              >
                Start Game
              </button>
            </div>
          )}

          {paused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-white text-2xl font-bold">PAUSED</span>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4">
              <span className="text-red-400 text-2xl font-bold">Game Over!</span>
              <span className="text-white text-lg">Score: {score}</span>
              {showSaveScore && score > 0 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveScore()}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm"
                    maxLength={15}
                  />
                  <button
                    onClick={handleSaveScore}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
              <button
                onClick={resetGame}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="flex justify-center md:hidden mb-6">
        <div className="grid grid-cols-3 gap-2 w-40">
          <div />
          <button onClick={() => handleMobileDirection("UP")} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg active:bg-slate-300 dark:active:bg-slate-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <div />
          <button onClick={() => handleMobileDirection("LEFT")} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg active:bg-slate-300 dark:active:bg-slate-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div />
          <button onClick={() => handleMobileDirection("RIGHT")} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg active:bg-slate-300 dark:active:bg-slate-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div />
          <button onClick={() => handleMobileDirection("DOWN")} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg active:bg-slate-300 dark:active:bg-slate-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div />
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <ShareButtons title="Snake Game" text={`I scored ${score} points in Snake on PlayZone! Can you beat me?`} />
      </div>

      <AdBanner slot="snake-bottom" format="rectangle" />
    </div>
  );
}
