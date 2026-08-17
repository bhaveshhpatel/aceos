'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SAMPLE_QUESTIONS = [
  {
    id: 'q1',
    unit_id: 'Unit 1: Atomic Structure',
    question: 'What is the molar mass of H2O (in g/mol)?',
    type: 'numerical',
    expected_value: 18.015,
  },
  {
    id: 'q2',
    unit_id: 'Unit 1: Atomic Structure',
    question: 'Which subatomic particle determines the chemical reactivity of an atom?',
    type: 'mcq',
    options: ['Proton', 'Neutron', 'Valence Electron', 'Alpha Particle'],
    correct_option: 2,
  },
  {
    id: 'q3',
    unit_id: 'Unit 2: Chemical Bonding',
    question: 'What type of bonding involves the sharing of electron pairs between atoms?',
    type: 'mcq',
    options: ['Ionic Bonding', 'Covalent Bonding', 'Metallic Bonding', 'Hydrogen Bonding'],
    correct_option: 1,
  },
];

export default function DiagnosticQuizPage({ params }: { params: { subject_slug: string } }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const currentQ = SAMPLE_QUESTIONS[currentIndex];

  function handleAnswer(answerValue: any) {
    setUserAnswers({ ...userAnswers, [currentQ.id]: answerValue });
  }

  async function handleSubmit() {
    setLoading(true);

    const formattedAnswers = SAMPLE_QUESTIONS.map((q) => {
      const val = userAnswers[q.id];
      let isCorrect = false;
      if (q.type === 'mcq') {
        isCorrect = val === q.correct_option;
      } else if (q.type === 'numerical' && q.expected_value !== undefined) {
        isCorrect = Math.abs(parseFloat(val) - q.expected_value) <= 0.1;
      }
      return {
        question_id: q.id,
        unit_id: q.unit_id,
        correct: isCorrect,
      };
    });

    try {
      const res = await fetch('/api/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_slug: params.subject_slug,
          answers: formattedAnswers,
        }),
      });

      if (res.ok) {
        router.push(`/diagnostic/${params.subject_slug}/results`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-2xl space-y-6 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-700">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            AP Diagnostic Quiz — Question {currentIndex + 1} of {SAMPLE_QUESTIONS.length}
          </h1>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            {currentQ.unit_id}
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">{currentQ.question}</p>

          {currentQ.type === 'mcq' && (
            <div className="space-y-2">
              {currentQ.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full rounded-md border p-3 text-left text-sm transition-all ${
                    userAnswers[currentQ.id] === idx
                      ? 'border-indigo-600 bg-indigo-50 font-semibold dark:bg-indigo-950/40 dark:text-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === 'numerical' && (
            <input
              type="number"
              step="any"
              placeholder="Enter numerical value"
              value={userAnswers[currentQ.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          )}
        </div>

        <div className="flex justify-between pt-4">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Previous
          </button>

          {currentIndex < SAMPLE_QUESTIONS.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Complete Diagnostic'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
