'use client';

/**
 * SubjectSelectionForm — S1-F-05
 *
 * Students select 1–6 AP subjects for personalized study.
 * Each selection initializes a Student Intelligence Profile (SIP).
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

export function SubjectSelectionForm() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from('ap_subjects')
          .select('id, name, description')
          .order('name');

        if (err) throw err;
        setSubjects(data || []);
      } catch (err) {
        console.error('[SubjectSelectionForm]', err);
        setError('Failed to load subjects. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const toggleSubject = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedIds.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/onboarding/select-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_ids: selectedIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to save subject selections');
        setSubmitting(false);
        return;
      }

      // Success — redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('[SubjectSelectionForm]', err);
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="auth-card text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-neutral-500">Loading subjects...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-heading text-neutral-900">Choose your AP subjects</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Select the AP courses you're taking. You can update this later.
          </p>
          <p className="text-xs text-neutral-500 mt-3">
            Choose 1–6 subjects
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* Subject grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjects.map((subject) => {
            const isSelected = selectedIds.includes(subject.id);
            const isMaxed = selectedIds.length >= 6 && !isSelected;

            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => !isMaxed && toggleSubject(subject.id)}
                disabled={isMaxed}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isMaxed
                        ? 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
                        : 'border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      flex-shrink-0 h-5 w-5 rounded border-2 mt-0.5
                      ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-neutral-300'
                      }
                    `}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-white m-0.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {subject.name}
                    </p>
                    {subject.description && (
                      <p className="text-xs text-neutral-600 mt-1">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection count */}
        {selectedIds.length > 0 && (
          <p className="text-sm text-neutral-600 text-center">
            {selectedIds.length} of 6 subjects selected
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting || selectedIds.length === 0}
          className="w-full"
        >
          {submitting ? 'Saving...' : 'Continue to Dashboard'}
        </Button>
      </form>
    </motion.div>
  );
}
