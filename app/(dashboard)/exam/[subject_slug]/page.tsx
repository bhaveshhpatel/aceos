'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubjectSwitcher } from '@/components/SubjectSwitcher';

import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';

function getExamQuestionsForSubject(subjectSlug: string) {
  const syllabus = OFFICIAL_AP_SYLLABI[subjectSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];
  const list: Array<{ id: string; number: number; unit: string; topic: string; question: string; options: string[]; correct: number; explanation: string }> = [];

  if (syllabus.questions && syllabus.questions.length > 0) {
    syllabus.questions.forEach((q, idx) => {
      list.push({
        id: q.id,
        number: idx + 1,
        unit: q.unit,
        topic: q.topic,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      });
    });
  }

  return list;
}

export default function ExamPracticePage({ params }: { params: { subject_slug: string } }) {
  const [questions, setQuestions] = useState<Array<{ id: string; number: number; unit: string; topic: string; question: string; options: string[]; correct: number; explanation: string }>>(() => getExamQuestionsForSubject(params.subject_slug));
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentIdx, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadAiQuestions() {
      try {
        const res = await fetch('/api/exam/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject_slug: params.subject_slug }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.questions) && data.questions.length >= 3) {
            const formatted = data.questions.map((q: any, idx: number) => ({
              id: q.id || `ai-${params.subject_slug}-${idx + 1}`,
              number: idx + 1,
              unit: q.unit || 'Core Unit',
              topic: q.topic || 'AP Concept',
              question: q.question,
              options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
              correct: typeof q.correct === 'number' ? q.correct : 0,
              explanation: q.explanation || 'Official AP Rubric Explanation.',
            }));
            setQuestions(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to load AI exam questions', err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadAiQuestions();
  }, [params.subject_slug]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(5400); // 90 minutes full length
  const [showFormulaSheet, setShowFormulaSheet] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const currentQ = questions[currentIdx] || questions[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function toggleFlag(qId: string) {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  }

  function handleSelectOption(optionIdx: number) {
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: optionIdx }));
  }

  async function handleSubmitExam() {
    setSubmitting(true);

    const timeSpent = 5400 - timeLeftSeconds;
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_option: userAnswers[q.id] ?? null,
      correct: userAnswers[q.id] === q.correct,
    }));

    const resultPayload = {
      subject_slug: params.subject_slug,
      time_spent_seconds: timeSpent,
      total_questions: questions.length,
      correct_count: formattedAnswers.filter((a) => a.correct).length,
      answers: questions.map((q, idx) => ({
        number: q.number,
        unit: q.unit,
        topic: q.topic,
        question: q.question,
        options: q.options,
        selected_option: userAnswers[q.id] ?? null,
        correct_option: q.correct,
        is_correct: userAnswers[q.id] === q.correct,
        explanation: `[College Board AP Rubric] ${q.topic} in ${q.unit}. Option ${String.fromCharCode(65 + q.correct)} is correct.`,
      })),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`last_exam_result_${params.subject_slug}`, JSON.stringify(resultPayload));
    }

    try {
      await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_slug: params.subject_slug,
          time_spent_seconds: timeSpent,
          answers: formattedAnswers,
        }),
      }).catch(console.error);

      router.push(`/exam/${params.subject_slug}/report`);
    } catch (err) {
      console.error(err);
      router.push(`/exam/${params.subject_slug}/report`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      {/* Bluebook Exam Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3">
        <div className="flex items-center space-x-4">
          <span className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-bold tracking-wider uppercase text-white">
            Bluebook™ Practice Mode
          </span>
          <span className="text-sm font-semibold text-slate-300">
            {params.subject_slug.replace('-', ' ').toUpperCase()}
          </span>
          <SubjectSwitcher currentSlug={params.subject_slug} basePath="/exam" />
        </div>

        {/* Section Timer */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <span className="block text-xs font-medium uppercase text-slate-400">Time Remaining</span>
            <span className="font-mono text-lg font-bold text-yellow-400">{formatTime(timeLeftSeconds)}</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowFormulaSheet(true)}
              className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              Formula Reference
            </button>
            <button
              onClick={() => setShowScratchpad(!showScratchpad)}
              className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              {showScratchpad ? 'Hide Scratchpad' : 'Scratchpad'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1">
        {/* Question & Option Panel */}
        <main className="flex flex-1 flex-col justify-between p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Question {currentQ.number} of {questions.length}
                </span>
                <span className="text-xs font-medium text-indigo-400 block">
                  {currentQ.unit} — {currentQ.topic}
                </span>
              </div>
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center space-x-1.5 text-xs font-semibold ${
                  flagged[currentQ.id] ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🚩</span>
                <span>{flagged[currentQ.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            <p className="text-lg font-medium text-slate-100">{currentQ.question}</p>

            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex w-full items-center space-x-4 rounded-lg border p-4 text-left transition-all ${
                    userAnswers[currentQ.id] === idx
                      ? 'border-indigo-500 bg-indigo-950/60 ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                      userAnswers[currentQ.id] === idx
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm text-slate-200">{opt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="mx-auto flex w-full max-w-3xl justify-between pt-8 border-t border-slate-800">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="rounded bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40"
            >
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="rounded bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="rounded bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting Exam...' : 'Finish Exam Section'}
              </button>
            )}
          </div>
        </main>

        {/* Right Palette Grid & Optional Scratchpad */}
        <aside className="w-80 border-l border-slate-800 bg-slate-950 p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Navigator Grid
            </h3>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                const isFlagged = flagged[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded font-semibold text-xs transition-all ${
                      isCurrent
                        ? 'border-2 border-indigo-400 bg-indigo-900 text-white'
                        : isAnswered
                        ? 'bg-slate-800 text-slate-200'
                        : 'border border-slate-800 bg-slate-900 text-slate-500'
                    }`}
                  >
                    {q.number}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 text-[10px]">🚩</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {showScratchpad && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                STEM Canvas Scratchpad
              </h3>
              <textarea
                rows={6}
                placeholder="Scratchpad calculations..."
                className="w-full rounded border border-slate-800 bg-slate-900 p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </aside>
      </div>

      {/* Formula Sheet Reference Modal */}
      {showFormulaSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Official Formula & Equation Sheet</h3>
              <button
                onClick={() => setShowFormulaSheet(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded border border-slate-800">
              <p>• Derivative Rules: d/dx(x^n) = n*x^(n-1)</p>
              <p>• Trigonometric Limit: lim (x-&gt;0) [sin(x)/x] = 1</p>
              <p>• Quadratic Formula: x = [-b ± sqrt(b^2 - 4ac)] / (2a)</p>
            </div>
            <button
              onClick={() => setShowFormulaSheet(false)}
              className="w-full rounded bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Close Formula Sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
