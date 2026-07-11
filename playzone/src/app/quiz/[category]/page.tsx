"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import ShareButtons from "@/components/ShareButtons";
import { quizCategories } from "@/data/quizzes";
import { addScore } from "@/lib/leaderboard";

export default function QuizGame({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();
  const quiz = quizCategories.find((c) => c.id === category);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showSaveScore, setShowSaveScore] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  useEffect(() => {
    if (quiz) {
      setAnswers(new Array(quiz.questions.length).fill(null));
    }
  }, [quiz]);

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
        <p className="text-slate-500 mb-6">This quiz category doesn&apos;t exist.</p>
        <button onClick={() => router.push("/quiz")} className="px-6 py-2 bg-indigo-500 text-white rounded-full font-medium">
          Browse Quizzes
        </button>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQ + (answered ? 1 : 0)) / totalQuestions) * 100;

  const handleAnswer = (optionIdx: number) => {
    if (answered) return;
    setSelected(optionIdx);
    setAnswered(true);

    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIdx;
    setAnswers(newAnswers);

    if (optionIdx === question.correct) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= totalQuestions) {
      setFinished(true);
      setShowSaveScore(true);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setSelected(null);
    setCorrectCount(0);
    setAnswered(false);
    setFinished(false);
    setShowSaveScore(false);
    setAnswers(new Array(totalQuestions).fill(null));
  };

  const handleSaveScore = () => {
    if (playerName.trim()) {
      addScore({
        name: playerName.trim(),
        score: correctCount * 100,
        game: `Quiz: ${quiz.title}`,
      });
      setShowSaveScore(false);
    }
  };

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  if (finished) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <AdBanner slot="quiz-result-top" format="horizontal" className="mb-6" />

        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
            scorePercent >= 80 ? "bg-green-100 dark:bg-green-900/30" :
            scorePercent >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30" :
            "bg-red-100 dark:bg-red-900/30"
          }`}>
            <span className="text-4xl">
              {scorePercent >= 80 ? "🏆" : scorePercent >= 50 ? "👍" : "📚"}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {scorePercent >= 80 ? "Excellent!" : scorePercent >= 50 ? "Good Job!" : "Keep Learning!"}
          </h2>

          <p className="text-lg text-slate-500 dark:text-slate-400 mb-2">
            {quiz.emoji} {quiz.title}
          </p>

          <div className="text-5xl font-extrabold mb-2">
            <span className={
              scorePercent >= 80 ? "text-green-500" :
              scorePercent >= 50 ? "text-yellow-500" :
              "text-red-500"
            }>{correctCount}</span>
            <span className="text-slate-300 dark:text-slate-600">/{totalQuestions}</span>
          </div>

          <p className="text-sm text-slate-400 mb-6">{scorePercent}% correct</p>

          {showSaveScore && correctCount > 0 && (
            <div className="flex gap-2 justify-center mb-6">
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

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button onClick={handleRestart} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-full transition-colors">
              Try Again
            </button>
            <button onClick={() => router.push("/quiz")} className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-full font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              More Quizzes
            </button>
          </div>

          <ShareButtons
            title={quiz.title}
            text={`I scored ${correctCount}/${totalQuestions} (${scorePercent}%) on the ${quiz.title} quiz on PlayZone! Can you beat me?`}
          />
        </div>

        <AdBanner slot="quiz-result-bottom" format="rectangle" className="mt-6" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{quiz.emoji} {quiz.title}</h1>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-1">
          <span>Question {currentQ + 1} of {totalQuestions}</span>
          <span>{correctCount} correct</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentQ > 0 && currentQ % 3 === 0 && !answered && (
        <AdBanner slot="quiz-interstitial" format="horizontal" className="mb-4" />
      )}

      {/* Question */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-6">{question.question}</h2>
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            let bgClass = "bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-slate-200 dark:border-slate-600 cursor-pointer";

            if (answered) {
              if (idx === question.correct) {
                bgClass = "bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600";
              } else if (idx === selected && idx !== question.correct) {
                bgClass = "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600";
              } else {
                bgClass = "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${bgClass}`}
              >
                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>{" "}
                {option}
                {answered && idx === question.correct && (
                  <span className="float-right text-green-500">✓</span>
                )}
                {answered && idx === selected && idx !== question.correct && (
                  <span className="float-right text-red-500">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {answered && question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Did you know?</strong> {question.explanation}
            </p>
          </div>
        )}
      </div>

      {answered && (
        <div className="flex justify-center">
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-full transition-colors text-lg"
          >
            {currentQ + 1 >= totalQuestions ? "See Results" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}
