'use client';

import { useState, useEffect } from 'react';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';

interface DrillItem {
  id: string;
  unit: string;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export default function WeakConceptDrillPage() {
  const [enrolledSubjects, setEnrolledSubjects] = useState<Array<{ name: string; slug: string }>>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('ap-chemistry');
  const [questions, setQuestions] = useState<DrillItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Fetch student enrolled subjects or default list
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch('/api/auth/subjects');
        if (res.ok) {
          const data = await res.json();
          if (data.subjects && data.subjects.length > 0) {
            setEnrolledSubjects(data.subjects);
            setSelectedSlug(data.subjects[0].slug);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch student enrolled subjects', err);
      }

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('student_selected_slugs');
        if (saved) {
          try {
            const slugs: string[] = JSON.parse(saved);
            const list = slugs.map((slug) => {
              const found = OFFICIAL_AP_SYLLABI[slug];
              return { name: found ? found.name : slug.toUpperCase(), slug };
            });
            setEnrolledSubjects(list);
            if (list.length > 0) setSelectedSlug(list[0].slug);
            return;
          } catch (e) {}
        }
      }

      setEnrolledSubjects([
        { name: 'AP Chemistry', slug: 'ap-chemistry' },
        { name: 'AP Calculus AB', slug: 'ap-calculus-ab' },
        { name: 'AP US History', slug: 'ap-us-history' },
      ]);
    }
    fetchSubjects();
  }, []);

  // Generate deduplicated questions for active subject
  useEffect(() => {
    const syllabus = OFFICIAL_AP_SYLLABI[selectedSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];
    const seenIds = new Set<string>();

    if (typeof window !== 'undefined') {
      const answered = localStorage.getItem(`answered_drills_${selectedSlug}`);
      if (answered) {
        try {
          JSON.parse(answered).forEach((id: string) => seenIds.add(id));
        } catch (e) {}
      }
    }

    const generated: DrillItem[] = [];
    let count = 1;

    if (syllabus.questions && syllabus.questions.length > 0) {
      syllabus.questions.forEach((q) => {
        if (!seenIds.has(q.id)) {
          generated.push({
            id: q.id,
            unit: q.unit,
            topic: q.topic,
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
          });
        }
      });
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOpt(null);
    setSubmitted(false);
    setCompleted(generated.length === 0);
  }, [selectedSlug]);

  const card = questions[currentIndex];

  function handleCheckAnswer() {
    if (selectedOpt === null || !card) return;
    setSubmitted(true);

    if (typeof window !== 'undefined') {
      const storageKey = `answered_drills_${selectedSlug}`;
      const saved = localStorage.getItem(storageKey);
      const list = saved ? JSON.parse(saved) : [];
      list.push(card.id);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  }

  function handleNextQuestion() {
    setSelectedOpt(null);
    setSubmitted(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCompleted(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {/* Top Header & Subject Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Weak Concept Target Drill
            </h1>
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
              AP Syllabus Weakness Practice
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="drill-subject" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Subject:
            </label>
            <select
              id="drill-subject"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              {enrolledSubjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {completed || !card ? (
          <div className="space-y-4 text-center py-8">
            <div className="text-4xl">🏆</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Drill Mastered for {OFFICIAL_AP_SYLLABI[selectedSlug]?.name || selectedSlug.toUpperCase()}!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You have completed all weak concept drill questions for this subject.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(`answered_drills_${selectedSlug}`);
                }
                setSelectedSlug(selectedSlug);
              }}
              className="rounded bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Reset Target Drill History
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{card.unit}</span>
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {card.topic}
              </span>
              <p className="text-base font-medium text-slate-900 dark:text-slate-100">{card.question}</p>
            </div>

            <div className="space-y-2">
              {card.options.map((opt, idx) => (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setSelectedOpt(idx)}
                  className={`w-full rounded-md border p-3 text-left text-sm transition-all ${
                    submitted
                      ? idx === card.correct
                        ? 'border-green-600 bg-green-50 text-green-900 font-semibold dark:bg-green-950/40 dark:text-green-200'
                        : idx === selectedOpt
                        ? 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200'
                        : 'border-slate-200 opacity-60 dark:border-slate-700'
                      : selectedOpt === idx
                      ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {submitted && (
              <div className="rounded-md bg-slate-100 p-4 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span className="font-bold">AP Rubric Explanation: </span> {card.explanation}
              </div>
            )}

            {!submitted ? (
              <button
                disabled={selectedOpt === null}
                onClick={handleCheckAnswer}
                className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-500"
              >
                Next Concept Drill Question →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
