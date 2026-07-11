import Link from "next/link";
import GameCard from "@/components/GameCard";
import AdBanner from "@/components/AdBanner";

const featuredGames = [
  { title: "Snake", description: "Classic snake game. Eat, grow, survive!", emoji: "🐍", href: "/games/snake", color: "from-green-500 to-emerald-600" },
  { title: "2048", description: "Merge tiles to reach 2048!", emoji: "🔢", href: "/games/2048", color: "from-amber-500 to-orange-600" },
  { title: "Memory Match", description: "Find all matching pairs!", emoji: "🧠", href: "/games/memory", color: "from-purple-500 to-pink-600" },
];

const quizCategories = [
  { title: "General Knowledge", emoji: "🌍", href: "/quiz/general-knowledge", color: "from-blue-500 to-cyan-500" },
  { title: "Science", emoji: "🔬", href: "/quiz/science", color: "from-green-500 to-emerald-500" },
  { title: "Movies", emoji: "🎬", href: "/quiz/movies", color: "from-purple-500 to-pink-500" },
  { title: "Technology", emoji: "💻", href: "/quiz/tech", color: "from-indigo-500 to-violet-500" },
  { title: "Sports", emoji: "⚽", href: "/quiz/sports", color: "from-orange-500 to-red-500" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Play. Quiz. <span className="text-yellow-300">Win.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Free online games and quizzes to challenge your brain. No downloads, no signups - just pure fun!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/games"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-indigo-600 font-semibold text-lg hover:bg-yellow-300 hover:text-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🎮 Play Games
              </Link>
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full border-2 border-white text-white font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300"
              >
                🧠 Take a Quiz
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-[var(--color-bg)]"/>
          </svg>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdBanner slot="hero-banner" format="horizontal" />
      </div>

      {/* Featured Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Games</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Pick a game and start playing!</p>
          </div>
          <Link href="/games" className="text-indigo-600 hover:text-indigo-500 font-medium text-sm">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredGames.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </section>

      {/* Quiz Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Popular Quizzes</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Test your knowledge in different topics!</p>
          </div>
          <Link href="/quiz" className="text-indigo-600 hover:text-indigo-500 font-medium text-sm">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quizCategories.map((cat) => (
            <Link key={cat.title} href={cat.href} className="group">
              <div className={`bg-gradient-to-br ${cat.color} rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                <span className="text-4xl block mb-2">{cat.emoji}</span>
                <span className="text-sm font-medium text-white">{cat.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Mid-page Ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdBanner slot="mid-page" format="rectangle" />
      </div>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Games", value: "3+", emoji: "🎮" },
            { label: "Quiz Categories", value: "5", emoji: "📚" },
            { label: "Questions", value: "50+", emoji: "❓" },
            { label: "100% Free", value: "Always", emoji: "🆓" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="text-3xl block mb-2">{stat.emoji}</span>
              <div className="text-2xl font-bold text-indigo-600">{stat.value}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
