import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎮</span>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                PlayZone
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Free online games and quizzes. Play, learn, and challenge your friends!
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400 mb-3">
              Play
            </h3>
            <ul className="space-y-2">
              <li><Link href="/games" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-500">All Games</Link></li>
              <li><Link href="/quiz" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-500">Quizzes</Link></li>
              <li><Link href="/leaderboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-500">Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400 mb-3">
              Legal
            </h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-500">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-500">Terms of Service</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-500">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} PlayZone. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
