'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';

export default function StudentHistoryPage() {
  const [examHistory, setExamHistory] = useState<any[]>([]);
  const [frqHistory, setFrqHistory] = useState<any[]>([]);
  const [reviewedCardsCount, setReviewedCardsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load exam attempt history
    const exams: any[] = [];
    Object.keys(OFFICIAL_AP_SYLLABI).forEach((slug) => {
      const saved = localStorage.getItem(`last_exam_result_${slug}`);
      if (saved) {
        try {
          exams.push(JSON.parse(saved));
        } catch (e) {}
      }
    });
    setExamHistory(exams);

    // Load FRQ submission history
    const frqs: any[] = [];
    Object.keys(OFFICIAL_AP_SYLLABI).forEach((slug) => {
      const saved = localStorage.getItem(`frq_history_${slug}`);
      if (saved) {
        try {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            frqs.push(...list.map((item: any) => ({ ...item, subject_slug: slug })));
          }
        } catch (e) {}
      }
    });
    setFrqHistory(frqs);

    // Load card review counts
    const cardCounts: Record<string, number> = {};
    Object.keys(OFFICIAL_AP_SYLLABI).forEach((slug) => {
      const saved = localStorage.getItem(`reviewed_cards_${slug}`);
      if (saved) {
        try {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            cardCounts[slug] = list.length;
          }
        } catch (e) {}
      }
    });
    setReviewedCardsCount(cardCounts);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            My Activity Progress & Session History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View your complete history of taken exams, submitted FRQ essays, and daily practice card reviews.
          </p>
        </div>

        {/* Section 1: Exam History */}
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            ⏱️ Practice Exam Simulation History
          </h2>

          {examHistory.length > 0 ? (
            <div className="space-y-4">
              {examHistory.map((exam, idx) => {
                const syllabus = OFFICIAL_AP_SYLLABI[exam.subject_slug] || { name: exam.subject_slug };
                const accuracy = Math.round((exam.correct_count / exam.total_questions) * 100);
                let apScore = 1;
                if (accuracy >= 80) apScore = 5;
                else if (accuracy >= 65) apScore = 4;
                else if (accuracy >= 50) apScore = 3;
                else if (accuracy >= 35) apScore = 2;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {syllabus.name} Practice Exam
                      </h3>
                      <p className="text-xs text-slate-500">
                        Accuracy: {accuracy}% ({exam.correct_count}/{exam.total_questions} Correct) • Time:{' '}
                        {Math.round(exam.time_spent_seconds / 60)} mins
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                        AP Score: {apScore} / 5
                      </span>
                      <Link
                        href={`/exam/${exam.subject_slug}/report`}
                        className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      >
                        View Full Report
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No completed AP practice exams yet. Take a full-length exam simulator session to generate your report.
            </p>
          )}
        </div>

        {/* Section 2: FRQ Submission History */}
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            ✍️ AI FRQ Essay Submission History
          </h2>

          {frqHistory.length > 0 ? (
            <div className="space-y-4">
              {frqHistory.map((item, idx) => {
                const syllabus = OFFICIAL_AP_SYLLABI[item.subject_slug] || { name: item.subject_slug };
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {syllabus.name} — {item.prompt_title}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium italic">
                      "{item.prompt_text}"
                    </p>

                    {item.feedback && (
                      <div className="rounded bg-white dark:bg-slate-800 p-3 text-xs space-y-1 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          AI Score: {item.feedback.total_score || item.feedback.overall_score || 5} / {item.feedback.max_score || 6}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300">
                          {item.feedback.overall_feedback || item.feedback.thesis_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No submitted FRQ responses yet. Submit an essay in the FRQ Grader portal to get AI rubric feedback.
            </p>
          )}
        </div>

        {/* Section 3: Flashcard & Practice Card Counts */}
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            📚 Daily Practice Card Review History
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(OFFICIAL_AP_SYLLABI).map(([slug, syllabus]) => {
              const count = reviewedCardsCount[slug] || 0;
              return (
                <div key={slug} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center">
                  <span className="text-xs font-bold text-slate-500 block">{syllabus.name}</span>
                  <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 block mt-1">
                    {count}
                  </span>
                  <span className="text-[11px] text-slate-400">Cards Reviewed</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
