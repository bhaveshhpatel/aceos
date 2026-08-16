'use client';

import { useState } from 'react';
import { FRQFeedback } from '@/components/frq/FRQFeedback';

export default function FRQPortalPage({ params }: { params: { subject_slug: string } }) {
  const [essayText, setEssayText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!essayText || essayText.trim().length < 20) return;

    setLoading(true);
    setFeedbackData(null);

    try {
      const res = await fetch('/api/frq/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_slug: params.subject_slug,
          essay_text: essayText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            AP Free-Response Question Submission Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Submit your essay or handwritten work for AI evaluation against official College Board rubrics.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Your Response (minimum 20 characters)
              </label>
              <textarea
                rows={8}
                required
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Type or paste your FRQ response here..."
                className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading || essayText.trim().length < 20}
              className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Grading Response...' : 'Submit FRQ for AI Grading'}
            </button>
          </form>
        </div>

        {feedbackData && <FRQFeedback feedback={feedbackData} />}
      </div>
    </div>
  );
}
