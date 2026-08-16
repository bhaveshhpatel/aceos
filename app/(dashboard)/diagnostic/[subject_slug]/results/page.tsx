import Link from 'next/link';

export default function DiagnosticResultsPage({ params }: { params: { subject_slug: string } }) {
  // Sample results data
  const predictedScore = 4;
  const unitHeatmap = [
    { name: 'Unit 1: Atomic Structure', mastery: 100 },
    { name: 'Unit 2: Chemical Bonding', mastery: 50 },
    { name: 'Unit 3: Intermolecular Forces', mastery: 40 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl space-y-8 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Diagnostic Assessment Complete
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Here is your readiness breakdown for {params.subject_slug.toUpperCase()}.
          </p>
        </div>

        {/* Predicted AP Score Badge */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50 p-6 dark:bg-indigo-950/40">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Predicted AP Score
          </span>
          <div className="mt-2 text-6xl font-extrabold text-indigo-700 dark:text-indigo-300">
            {predictedScore} / 5
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Based on College Board scoring curves & unit accuracy.
          </p>
        </div>

        {/* AP Unit Mastery Heatmap */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Unit Mastery Heatmap
          </h2>
          <div className="space-y-3">
            {unitHeatmap.map((unit, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>{unit.name}</span>
                  <span>{unit.mastery}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-2.5 rounded-full ${
                      unit.mastery >= 75
                        ? 'bg-green-500'
                        : unit.mastery >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${unit.mastery}%` }}
                  />
                </div>
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
