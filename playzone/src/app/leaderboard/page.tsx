"use client";

import { useState, useEffect } from "react";
import AdBanner from "@/components/AdBanner";
import { getTopScores, type LeaderboardEntry } from "@/lib/leaderboard";

const GAME_FILTERS = ["All", "Snake", "2048", "Memory Match", "Quiz: General Knowledge", "Quiz: Science", "Quiz: Movies", "Quiz: Technology", "Quiz: Sports"];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("All");
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const gameFilter = filter === "All" ? undefined : filter;
    setScores(getTopScores(gameFilter, 20));
  }, [filter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold mb-3">🏆 Leaderboard</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Top scores from all games and quizzes
        </p>
      </div>

      <AdBanner slot="leaderboard-top" format="horizontal" className="mb-6" />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {GAME_FILTERS.map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === g
                ? "bg-indigo-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {g.replace("Quiz: ", "")}
          </button>
        ))}
      </div>

      {/* Scores Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {scores.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🎮</span>
            <h3 className="text-lg font-semibold mb-2">No scores yet!</h3>
            <p className="text-slate-500 dark:text-slate-400">Play some games and your scores will show up here.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 text-left w-12">Rank</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Game</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((entry, i) => (
                <tr
                  key={`${entry.name}-${entry.date}-${i}`}
                  className={`border-b border-slate-100 dark:border-slate-700/50 ${
                    i < 3 ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-lg">{getMedal(i)}</td>
                  <td className="px-4 py-3 font-medium">{entry.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{entry.game}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">{entry.score.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-400 hidden sm:table-cell">{formatDate(entry.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdBanner slot="leaderboard-bottom" format="rectangle" className="mt-6" />
    </div>
  );
}
