'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSubjectSelections } from '@/app/actions/subjects';

const PHASE_1_SUBJECTS = [
  { slug: 'ap-chemistry', name: 'AP Chemistry', icon: '🧪' },
  { slug: 'ap-biology', name: 'AP Biology', icon: '🧬' },
  { slug: 'ap-calculus-ab', name: 'AP Calculus AB', icon: '∫' },
  { slug: 'ap-us-history', name: 'AP US History', icon: '🇺🇸' },
  { slug: 'ap-world-history', name: 'AP World History', icon: '🌍' },
  { slug: 'ap-lang', name: 'AP English Language & Composition', icon: '✍️' },
];

export default function SubjectSelectionPage() {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggleSubject(slug: string) {
    setError(null);
    if (selectedSlugs.includes(slug)) {
      setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
    } else {
      if (selectedSlugs.length >= 4) {
        setError('You can select a maximum of 4 AP subjects.');
        return;
      }
      setSelectedSlugs([...selectedSlugs, slug]);
    }
  }

  async function handleSubmit() {
    if (selectedSlugs.length < 1) {
      setError('Please select at least one AP subject to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await saveSubjectSelections(selectedSlugs);

    if (!res.success) {
      setError(res.error || 'Failed to save subject selections.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-2xl space-y-8 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Select Your AP Subjects
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Choose between 1 and 4 AP courses you are preparing for this year.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PHASE_1_SUBJECTS.map((subject) => {
            const isSelected = selectedSlugs.includes(subject.slug);
            return (
              <button
                key={subject.slug}
                type="button"
                onClick={() => toggleSubject(subject.slug)}
                className={`flex items-center space-x-3 rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/30'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <span className="text-2xl">{subject.icon}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{subject.name}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
