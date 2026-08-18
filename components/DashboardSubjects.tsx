'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { saveSubjectSelections } from '@/app/actions/subjects';
import { LAUNCH_SUBJECTS_CATALOG } from '@/config/subjects_catalog';

interface SubjectItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export function DashboardSubjects({ initialSubjects }: { initialSubjects: SubjectItem[] }) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects);

  useEffect(() => {
    // If initial server subjects exist, write them to local storage for local persistence
    if (initialSubjects && initialSubjects.length > 0) {
      const slugs = initialSubjects.map((s) => s.slug);
      localStorage.setItem('student_selected_slugs', JSON.stringify(slugs));
      return;
    }

    // If server subjects are empty, check localStorage fallback
    const saved = localStorage.getItem('student_selected_slugs');
    if (saved) {
      try {
        const slugs: string[] = JSON.parse(saved);
        if (Array.isArray(slugs) && slugs.length > 0) {
          const fallbackList: SubjectItem[] = slugs.map((slug) => {
            const found = LAUNCH_SUBJECTS_CATALOG.find((item) => item.slug === slug);
            return {
              id: slug,
              name: found ? found.name : slug.toUpperCase().replace('-', ' '),
              slug,
              icon: found ? found.icon : '📚',
            };
          });
          setSubjects(fallbackList);

          // Persist to Supabase DB in the background
          saveSubjectSelections(slugs).catch(console.error);
        }
      } catch (err) {
        console.error('Failed to parse student_selected_slugs from localStorage', err);
      }
    }
  }, [initialSubjects]);

  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You have not selected any AP subjects yet.
        </p>
        <div className="mt-4">
          <Link
            href="/onboarding/subjects"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Select AP Subjects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {subjects.map((subject) => (
        <div
          key={subject.id}
          className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{subject.icon}</span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {subject.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Diagnostic required (~45 mins)
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Link
              href={`/diagnostic/${subject.slug}`}
              className="block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Take Diagnostic
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/frq/${subject.slug}`}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                ✍️ FRQ Grader
              </Link>
              <Link
                href={`/exam/${subject.slug}`}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                ⏱️ Exam Simulator
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
