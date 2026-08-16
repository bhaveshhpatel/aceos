interface RubricPoint {
  point_id: string;
  point_description: string;
  status: 'EARNED' | 'PARTIALLY_EARNED' | 'NOT_EARNED';
  evidence_quote: string | null;
  feedback: string;
}

interface FRQFeedbackProps {
  feedback: {
    total_score: number;
    max_score: number;
    rubric_points: RubricPoint[];
    overall_feedback: string;
  };
}

export function FRQFeedback({ feedback }: FRQFeedbackProps) {
  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow dark:bg-slate-800">
      <div className="flex items-center justify-between border-b pb-4 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Official Rubric Evaluation
        </h2>
        <div className="text-right">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {feedback.total_score} / {feedback.max_score}
          </span>
          <p className="text-xs text-slate-500">Points Earned</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Rubric Breakdown
        </h3>
        {feedback.rubric_points.map((pt, idx) => (
          <div
            key={idx}
            className="rounded-md border border-slate-200 p-4 space-y-2 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {pt.point_description}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  pt.status === 'EARNED'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : pt.status === 'PARTIALLY_EARNED'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}
              >
                {pt.status.replace('_', ' ')}
              </span>
            </div>

            {pt.evidence_quote && (
              <blockquote className="border-l-2 border-slate-300 pl-3 text-xs italic text-slate-600 dark:border-slate-600 dark:text-slate-400">
                "{pt.evidence_quote}"
              </blockquote>
            )}

            <p className="text-xs text-slate-700 dark:text-slate-300">{pt.feedback}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md bg-indigo-50/50 p-4 dark:bg-indigo-950/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
          Overall Evaluator Feedback
        </h3>
        <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
          {feedback.overall_feedback}
        </p>
      </div>
    </div>
  );
}
