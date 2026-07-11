"use client";

import { useState, useEffect, useCallback } from "react";
import AdBanner from "@/components/AdBanner";
import ShareButtons from "@/components/ShareButtons";
import { addScore } from "@/lib/leaderboard";

const EMOJIS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCards(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  const shuffled = shuffleArray(pairs);
  return shuffled.map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(createCards);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showSaveScore, setShowSaveScore] = useState(false);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("memory_besttime");
    if (saved) setBestTime(parseInt(saved));
  }, []);

  useEffect(() => {
    if (started && !finished) {
      const interval = setInterval(() => setTimer((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [started, finished]);

  const handleCardClick = useCallback(
    (id: number) => {
      if (flippedIds.length >= 2) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return;

      if (!started) setStarted(true);

      const newCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
      setCards(newCards);

      const newFlipped = [...flippedIds, id];
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        const [first, second] = newFlipped.map((fid) => newCards.find((c) => c.id === fid)!);

        if (first.emoji === second.emoji) {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
              )
            );
            setMatches((m) => {
              const newMatches = m + 1;
              if (newMatches === EMOJIS.length) {
                setFinished(true);
                setShowSaveScore(true);
                setBestTime((prev) => {
                  const current = timer;
                  if (prev === null || current < prev) {
                    localStorage.setItem("memory_besttime", String(current));
                    return current;
                  }
                  return prev;
                });
              }
              return newMatches;
            });
            setFlippedIds([]);
          }, 500);
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c
              )
            );
            setFlippedIds([]);
          }, 800);
        }
      }
    },
    [cards, flippedIds, started, timer]
  );

  const resetGame = () => {
    setCards(createCards());
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setStarted(false);
    setFinished(false);
    setShowSaveScore(false);
  };

  const handleSaveScore = () => {
    if (playerName.trim()) {
      const finalScore = Math.max(0, 1000 - moves * 10 - timer * 5);
      addScore({ name: playerName.trim(), score: finalScore, game: "Memory Match" });
      setShowSaveScore(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">🧠 Memory Match</h1>
        <p className="text-slate-500 dark:text-slate-400">Find all matching pairs!</p>
      </div>

      <AdBanner slot="memory-top" format="horizontal" className="mb-6" />

      <div className="flex justify-center gap-4 mb-6">
        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Moves</div>
          <div className="text-xl font-bold text-indigo-600">{moves}</div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Time</div>
          <div className="text-xl font-bold text-amber-500">{formatTime(timer)}</div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Pairs</div>
          <div className="text-xl font-bold text-green-500">{matches}/{EMOJIS.length}</div>
        </div>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors self-center"
        >
          Reset
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-4 gap-3 max-w-[320px]">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl text-3xl flex items-center justify-center transition-all duration-300 ${
                card.matched
                  ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-400 scale-95"
                  : card.flipped
                  ? "bg-white dark:bg-slate-700 border-2 border-indigo-400 shadow-lg"
                  : "bg-indigo-500 hover:bg-indigo-600 cursor-pointer shadow-md hover:shadow-lg"
              }`}
              disabled={card.matched || card.flipped}
            >
              {card.flipped || card.matched ? card.emoji : "?"}
            </button>
          ))}
        </div>
      </div>

      {finished && (
        <div className="text-center mb-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">🎉 Congratulations!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-1">
            Completed in {moves} moves and {formatTime(timer)}!
          </p>
          {bestTime !== null && (
            <p className="text-sm text-slate-500 mb-4">Best time: {formatTime(bestTime)}</p>
          )}
          {showSaveScore && (
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

      <div className="flex justify-center mb-6">
        <ShareButtons title="Memory Match" text={`I completed Memory Match in ${moves} moves and ${formatTime(timer)}! Try it on PlayZone!`} />
      </div>

      <AdBanner slot="memory-bottom" format="rectangle" />
    </div>
  );
}
