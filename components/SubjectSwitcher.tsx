'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubjectItem {
  id: string;
  name: string;
  slug: string;
}

interface SubjectSwitcherProps {
  currentSlug: string;
  basePath: '/frq' | '/exam' | '/diagnostic';
}

export function SubjectSwitcher({ currentSlug, basePath }: SubjectSwitcherProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch('/api/auth/subjects');
        if (res.ok) {
          const data = await res.json();
          if (data.subjects && data.subjects.length > 0) {
            setSubjects(data.subjects);
          }
        }
      } catch (e) {
        console.error('Failed to fetch enrolled subjects', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  if (loading || subjects.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 rounded-lg bg-slate-100 p-2 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <label htmlFor="subject-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        AP Subject:
      </label>
      <select
        id="subject-select"
        value={currentSlug}
        onChange={(e) => router.push(`${basePath}/${e.target.value}`)}
        className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      >
        {subjects.map((sub) => (
          <option key={sub.slug} value={sub.slug}>
            {sub.name}
          </option>
        ))}
      </select>
    </div>
  );
}
