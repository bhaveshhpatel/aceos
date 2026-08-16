'use client';

import { useState } from 'react';

const WEAK_CONCEPT_CARDS = [
  {
    unit: 'Unit 3: Intermolecular Forces',
    question: 'Which intermolecular force is strongest in liquid water (H2O)?',
    options: ['London Dispersion Forces', 'Dipole-Dipole Forces', 'Hydrogen Bonding', 'Ion-Dipole Forces'],
    correct: 2,
    explanation: 'Water molecules form strong hydrogen bonds between the oxygen atom of one molecule and hydrogen of another.',
  },
];

export default function WeakConceptDrillPage() {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const card = WEAK_CONCEPT_CARDS[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-lg space-y-6 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <div className="flex justify-between text-xs text-red-600 font-semibold dark:text-red-400">
          <span>Weak Concept Target Drill</span>
          <span>{card.unit}</span>
        </div>

        <p className="text-base font-medium text-slate-900 dark:text-slate-100">{card.question}</p>

        <div className="space-y-2">
          {card.options.map((opt, idx) => (
            <button
              key={idx}
              disabled={submitted}
              onClick={() => setSelectedOpt(idx)}
              className={`w-full rounded-md border p-3 text-left text-sm transition-all ${
                submitted
                  ? idx === card.correct
                    ? 'border-green-600 bg-green-50 text-green-900 font-semibold'
                    : idx === selectedOpt
                    ? 'border-red-600 bg-red-50 text-red-900'
                    : 'border-slate-200 opacity-60'
                  : selectedOpt === idx
                  ? 'border-indigo-600 bg-indigo-50 font-semibold'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {submitted && (
          <div className="rounded-md bg-slate-100 p-4 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span className="font-bold">Explanation: </span> {card.explanation}
          </div>
        )}

        {!submitted && (
          <button
            disabled={selectedOpt === null}
            onClick={() => setSubmitted(true)}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
          >
            Check Answer
          </button>
        )}
      </div>
    </div>
  );
}
