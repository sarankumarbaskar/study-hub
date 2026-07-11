"use client";

import { useState, useEffect, useCallback } from "react";
import AdBanner from "@/components/AdBanner";
import ShareButtons from "@/components/ShareButtons";
import { addScore } from "@/lib/leaderboard";

type Board = number[][];

const SIZE = 4;

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(board: Board): Board {
  const newBoard = board.map((row) => [...row]);
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (newBoard[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return newBoard;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function slideRow(row: number[]): { newRow: number[]; scored: number } {
  const filtered = row.filter((v) => v !== 0);
  let scored = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      scored += filtered[i] * 2;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i += 1;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { newRow: merged, scored };
}

function moveLeft(board: Board): { board: Board; scored: number; moved: boolean } {
  let totalScored = 0;
  let moved = false;
  const newBoard = board.map((row) => {
    const { newRow, scored } = slideRow(row);
    totalScored += scored;
    if (row.some((v, i) => v !== newRow[i])) moved = true;
    return newRow;
  });
  return { board: newBoard, scored: totalScored, moved };
}

function rotateBoard(board: Board): Board {
  const newBoard = createEmptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      newBoard[c][SIZE - 1 - r] = board[r][c];
    }
  }
  return newBoard;
}

function move(board: Board, direction: string): { board: Board; scored: number; moved: boolean } {
  let rotated = board;
  let rotations = 0;

  if (direction === "up") { rotations = 1; }
  else if (direction === "right") { rotations = 2; }
  else if (direction === "down") { rotations = 3; }

  for (let i = 0; i < rotations; i++) rotated = rotateBoard(rotated);

  const result = moveLeft(rotated);

  let finalBoard = result.board;
  for (let i = 0; i < (4 - rotations) % 4; i++) finalBoard = rotateBoard(finalBoard);

  return { board: finalBoard, scored: result.scored, moved: result.moved };
}

function canMove(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon(board: Board): boolean {
  return board.some((row) => row.some((v) => v >= 2048));
}

const TILE_COLORS: Record<number, string> = {
  0: "bg-slate-200 dark:bg-slate-700",
  2: "bg-amber-100 text-slate-800",
  4: "bg-amber-200 text-slate-800",
  8: "bg-orange-300 text-white",
  16: "bg-orange-400 text-white",
  32: "bg-orange-500 text-white",
  64: "bg-red-400 text-white",
  128: "bg-yellow-400 text-white",
  256: "bg-yellow-500 text-white",
  512: "bg-yellow-600 text-white",
  1024: "bg-amber-500 text-white",
  2048: "bg-amber-600 text-white font-extrabold",
};

export default function Game2048() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showSaveScore, setShowSaveScore] = useState(false);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("2048_bestscore");
    if (saved) setBestScore(parseInt(saved));
    const initial = addRandomTile(addRandomTile(createEmptyBoard()));
    setBoard(initial);
  }, []);

  const handleMove = useCallback(
    (direction: string) => {
      if (gameOver) return;

      const result = move(board, direction);
      if (!result.moved) return;

      const newBoard = addRandomTile(result.board);
      setBoard(newBoard);
      setScore((prev) => {
        const newScore = prev + result.scored;
        setBestScore((best) => {
          if (newScore > best) {
            localStorage.setItem("2048_bestscore", String(newScore));
            return newScore;
          }
          return best;
        });
        return newScore;
      });

      if (hasWon(newBoard) && !won) {
        setWon(true);
      }

      if (!canMove(newBoard)) {
        setGameOver(true);
        setShowSaveScore(true);
      }
    },
    [board, gameOver, won]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const keyMap: Record<string, string> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  useEffect(() => {
    let startX = 0, startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 30) return;

      if (absDx > absDy) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMove]);

  const resetGame = () => {
    const initial = addRandomTile(addRandomTile(createEmptyBoard()));
    setBoard(initial);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setShowSaveScore(false);
  };

  const handleSaveScore = () => {
    if (playerName.trim() && score > 0) {
      addScore({ name: playerName.trim(), score, game: "2048" });
      setShowSaveScore(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">🔢 2048</h1>
        <p className="text-slate-500 dark:text-slate-400">Swipe or use arrow keys to merge tiles!</p>
      </div>

      <AdBanner slot="2048-top" format="horizontal" className="mb-6" />

      <div className="flex justify-center gap-6 mb-4">
        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-center min-w-[80px]">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Score</div>
          <div className="text-xl font-bold text-indigo-600">{score}</div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-center min-w-[80px]">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Best</div>
          <div className="text-xl font-bold text-amber-500">{bestScore}</div>
        </div>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
        >
          New Game
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-slate-300 dark:bg-slate-600 rounded-xl p-3 inline-block">
          <div className="grid grid-cols-4 gap-2">
            {board.flat().map((value, i) => (
              <div
                key={i}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center font-bold transition-all duration-100 ${TILE_COLORS[value] || "bg-amber-700 text-white"} ${value >= 1024 ? "text-lg" : value >= 128 ? "text-xl" : "text-2xl"}`}
              >
                {value > 0 ? value : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="text-center mb-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Game Over!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Final Score: {score}</p>
          {showSaveScore && score > 0 && (
            <div className="flex gap-2 justify-center mb-4">
              <input
                type="text"
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveScore()}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                maxLength={15}
              />
              <button onClick={handleSaveScore} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium">
                Save Score
              </button>
            </div>
          )}
          <button onClick={resetGame} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors">
            Play Again
          </button>
        </div>
      )}

      {won && !gameOver && (
        <div className="text-center mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-xl font-bold text-yellow-600">🎉 You reached 2048! Keep going?</h2>
        </div>
      )}

      <div className="flex justify-center mb-6">
        <ShareButtons title="2048 Game" text={`I scored ${score} in 2048 on PlayZone! Can you beat me?`} />
      </div>

      <AdBanner slot="2048-bottom" format="rectangle" />
    </div>
  );
}
