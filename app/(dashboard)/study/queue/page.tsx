'use client';

import { useState } from 'react';
import { calculateFSRS, FSRSCardState, FSRSGrade } from '@/lib/fsrs/fsrs';

const DUE_CARDS = [
  {
    id: 'card1',
    question: 'What is the rate law expression for a zero-order reaction?',
    answer: 'Rate = k',
    initialState: { stability: 1, difficulty: 5, repetition: 0, lapses: 0, last_review: new Date().toISOString() },
  },
  {
    id: 'card2',
    question: 'How is pH calculated from hydronium ion concentration [H+]?',
    answer: 'pH = -log[H+]',
    initialState: { stability: 2, difficulty: 4, repetition: 1, lapses: 0, last_review: new Date().toISOString() },
  },
];

export default function StudyQueuePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);

  const card = DUE_CARDS[currentIndex];

  async function handleGrade(grade: FSRSGrade) {
    const result = calculateFSRS(card.initialState as FSRSCardState, grade);

    await fetch('/api/study/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: card.id,
        grade,
        next_state: result.nextState,
        interval_days: result.intervalDays,
      }),
    }).catch(console.error);

    setShowAnswer(false);
    if (currentIndex < DUE_CARDS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
        <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow dark:bg-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Queue Completed! 🎉</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Great job! You have reviewed all cards due in your daily queue today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-lg space-y-6 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Daily Review Queue</span>
          <span>Card {currentIndex + 1} of {DUE_CARDS.length}</span>
        </div>

        <div className="min-h-[140px] space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.question}</p>

          {showAnswer && (
            <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{card.answer}</p>
            </div>
          )}
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500"
          >
            Show Answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleGrade('again')}
              className="rounded-md bg-red-100 px-2 py-2 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
            >
              Again
            </button>
            <button
              onClick={() => handleGrade('hard')}
              className="rounded-md bg-orange-100 px-2 py-2 text-xs font-bold text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300"
            >
              Hard
            </button>
            <button
              onClick={() => handleGrade('good')}
              className="rounded-md bg-green-100 px-2 py-2 text-xs font-bold text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
            >
              Good
            </button>
            <button
              onClick={() => handleGrade('easy')}
              className="rounded-md bg-blue-100 px-2 py-2 text-xs font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300"
            >
              Easy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
