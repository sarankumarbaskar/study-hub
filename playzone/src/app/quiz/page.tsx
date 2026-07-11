import type { Metadata } from "next";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { quizCategories } from "@/data/quizzes";

export const metadata: Metadata = {
  title: "Free Online Quizzes & Trivia",
  description: "Test your knowledge with fun quizzes! General knowledge, science, movies, tech, sports and more.",
};

export default function QuizPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-3">🧠 Quizzes & Trivia</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Choose a category and test your knowledge! 10 questions per quiz.
        </p>
      </div>

      <AdBanner slot="quiz-top" format="horizontal" className="mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizCategories.map((cat) => (
          <Link key={cat.id} href={`/quiz/${cat.id}`} className="group">
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.color} p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
              <div className="absolute -right-4 -top-4 text-8xl opacity-20 transition-transform duration-300 group-hover:scale-110">
                {cat.emoji}
              </div>
              <div className="relative z-10">
                <span className="text-5xl mb-4 block">{cat.emoji}</span>
                <h3 className="text-2xl font-bold text-white mb-2">{cat.title}</h3>
                <p className="text-sm text-white/80 mb-4">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                    {cat.questions.length} Questions
                  </span>
                  <span className="text-sm font-medium text-white bg-white/20 px-4 py-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                    Start Quiz →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <AdBanner slot="quiz-bottom" format="rectangle" className="mt-8" />
    </div>
  );
}
