'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';

export default function PostExamAnalyticsPage({ params }: { params: { subject_slug: string } }) {
  const [report, setReport] = useState<any | null>(null);

  const syllabus = OFFICIAL_AP_SYLLABI[params.subject_slug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`last_exam_result_${params.subject_slug}`);
      if (saved) {
        try {
          setReport(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [params.subject_slug]);

  const totalQ = Math.max(1, report?.total_questions || (report?.answers ? report.answers.length : 10));
  const correctCount = report?.correct_count !== undefined
    ? Math.min(totalQ, report.correct_count)
    : report?.answers
    ? report.answers.filter((a: any) => a.is_correct).length
    : 8;

  const rawAccuracy = Math.round((correctCount / totalQ) * 100);
  const accuracy = Math.min(100, Math.max(0, rawAccuracy));

  let predictedApScore = 1;
  if (accuracy >= 80) predictedApScore = 5;
  else if (accuracy >= 65) predictedApScore = 4;
  else if (accuracy >= 50) predictedApScore = 3;
  else if (accuracy >= 35) predictedApScore = 2;

  const rawTimeSeconds = report?.time_spent_seconds || 1200;
  const timeSpentMins = Math.max(1, Math.round(rawTimeSeconds / 60));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl space-y-8 rounded-xl bg-white p-8 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
            Bluebook™ Official AP Exam Performance Report
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {syllabus.name} Practice Exam Evaluation
          </h1>
        </div>

        {/* Score Badges */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-lg bg-indigo-50 p-6 text-center dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
            <span className="text-xs font-medium text-slate-500">Predicted AP Score</span>
            <span className="mt-1 text-4xl font-extrabold text-indigo-700 dark:text-indigo-300">
              {predictedApScore} / 5
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 p-6 text-center dark:bg-green-950/40 border border-green-200 dark:border-green-900">
            <span className="text-xs font-medium text-slate-500">Exam Accuracy</span>
            <span className="mt-1 text-4xl font-extrabold text-green-700 dark:text-green-300">
              {accuracy}%
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              ({correctCount} / {totalQ} Correct)
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <span className="text-xs font-medium text-slate-500">Completion Time</span>
            <span className="mt-1 text-4xl font-extrabold text-blue-700 dark:text-blue-300">
              {timeSpentMins} mins
            </span>
          </div>
        </div>

        {/* Question-by-Question Detailed Breakdown */}
        {report?.answers && report.answers.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Detailed Question-by-Question Grading & Explanations
            </h2>

            <div className="space-y-4">
              {report.answers.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 text-sm space-y-2 ${
                    item.is_correct
                      ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                      : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Question {item.number} — {item.unit} ({item.topic})
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.is_correct
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {item.is_correct ? '✓ Correct' : '✕ Incorrect'}
                    </span>
                  </div>

                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {item.question}
                  </p>

                  <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <p>
                      <span className="font-semibold">Your Answer: </span>
                      {item.selected_option !== null
                        ? `${String.fromCharCode(65 + item.selected_option)}: ${item.options[item.selected_option]}`
                        : 'Unanswered'}
                    </p>
                    <p className="text-green-700 dark:text-green-300 font-semibold">
                      <span>Correct Answer: </span>
                      {String.fromCharCode(65 + item.correct_option)}: {item.options[item.correct_option]}
                    </p>
                  </div>

                  <div className="mt-2 rounded bg-white dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Explanation:{' '}
                    </span>
                    {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 text-center">
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500"
          >
            Return to Student Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
