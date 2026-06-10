'use client';

/**
 * DashboardContent — S1-F-06
 *
 * Welcome screen and subject cards showing selected AP courses
 * and next steps (Take Diagnostic, View Settings).
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Settings, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface Subject {
  id: string;
  name: string;
}

export interface DashboardContentProps {
  student_name: string;
}

export function DashboardContent({ student_name }: DashboardContentProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get their selected subjects
        const { data, error } = await supabase
          .from('student_ap_subjects')
          .select(
            `
            ap_subject_id,
            ap_subjects:ap_subject_id (id, name)
          `
          )
          .eq('student_id', user.id)
          .eq('is_active', true);

        if (!error && data) {
          const subjectList = data
            .map((item: any) => item.ap_subjects)
            .filter(Boolean) as Subject[];
          setSubjects(subjectList);
        }
      } catch (err) {
        console.error('[DashboardContent]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Welcome, {student_name.split(' ')[0]}!
        </h1>
        <p className="text-lg text-neutral-600">
          You're all set. Let's get started on improving your AP scores.
        </p>
      </motion.div>

      {/* Selected Subjects */}
      {!loading && subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg border border-neutral-200 p-6"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Your AP Subjects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-neutral-900">
                  {subject.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Take Diagnostic Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-blue-300 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-neutral-900">Take Diagnostic</h3>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            Start with a diagnostic test to see your current mastery level across all units.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-between"
            disabled={true}
          >
            Coming Soon
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View Settings Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
              <Settings className="h-6 w-6 text-neutral-600" />
            </div>
            <h3 className="font-semibold text-neutral-900">Settings</h3>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            Update your profile, change your AP subjects, or manage your account.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-between"
            onClick={() => window.location.href = '/dashboard/settings'}
          >
            Go to Settings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Help Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
              <HelpCircle className="h-6 w-6 text-neutral-600" />
            </div>
            <h3 className="font-semibold text-neutral-900">Help & FAQ</h3>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            Have questions? Check out our FAQ or contact support.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-between"
            disabled={true}
          >
            Coming Soon
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
