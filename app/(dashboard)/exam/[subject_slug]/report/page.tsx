import Link from 'next/link';

export default function PostExamAnalyticsPage({ params }: { params: { subject_slug: string } }) {
  const score = 4;
  const accuracy = 75;
  const timeSpentMins = 24;

  const scoreTrends = [
    { exam: 'Diagnostic', score: 3 },
    { exam: 'Practice Exam 1', score: 3 },
    { exam: 'Practice Exam 2 (Current)', score: 4 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl space-y-8 rounded-xl bg-white p-8 shadow dark:bg-slate-800">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Bluebook™ Full-Length Practice Exam Report
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Performance & Score Trend Analytics
          </h1>
        </div>

        {/* Score Badge */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-lg bg-indigo-50 p-6 text-center dark:bg-indigo-950/40">
            <span className="text-xs font-medium text-slate-500">AP Score Projection</span>
            <span className="mt-1 text-4xl font-extrabold text-indigo-700 dark:text-indigo-300">{score} / 5</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 p-6 text-center dark:bg-green-950/40">
            <span className="text-xs font-medium text-slate-500">Overall Accuracy</span>
            <span className="mt-1 text-4xl font-extrabold text-green-700 dark:text-green-300">{accuracy}%</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-950/40">
            <span className="text-xs font-medium text-slate-500">Section Completion Time</span>
            <span className="mt-1 text-4xl font-extrabold text-blue-700 dark:text-blue-300">{timeSpentMins} mins</span>
          </div>
        </div>

        {/* Score Trend History */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Historical AP Score Trend</h2>
          <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            {scoreTrends.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{t.exam}</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Score: {t.score} / 5</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
