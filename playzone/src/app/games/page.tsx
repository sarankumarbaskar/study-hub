import type { Metadata } from "next";
import GameCard from "@/components/GameCard";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "Free Online Games",
  description: "Play free online games - Snake, 2048, Memory Match and more! No download required.",
};

const games = [
  { title: "Snake", description: "Guide the snake, eat food, and grow! Don't hit the walls or yourself.", emoji: "🐍", href: "/games/snake", color: "from-green-500 to-emerald-600", players: "1 Player" },
  { title: "2048", description: "Slide and merge numbered tiles to reach the elusive 2048 tile!", emoji: "🔢", href: "/games/2048", color: "from-amber-500 to-orange-600", players: "1 Player" },
  { title: "Memory Match", description: "Flip cards and find matching pairs. Test your memory!", emoji: "🧠", href: "/games/memory", color: "from-purple-500 to-pink-600", players: "1 Player" },
];

export default function GamesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-3">
          🎮 Free Online Games
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Jump right in - no downloads, no signups. Just click and play!
        </p>
      </div>

      <AdBanner slot="games-top" format="horizontal" className="mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <GameCard key={game.title} {...game} />
        ))}
      </div>

      <AdBanner slot="games-bottom" format="horizontal" className="mt-8" />
    </div>
  );
}
