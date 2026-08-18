import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { DashboardSubjects } from '@/components/DashboardSubjects';

function serviceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-service-key';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  return createServiceClient(
    url,
    serviceKey
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = serviceClient();

  let firstName = 'Student';
  let enrolledSubjects: Array<{ id: string; name: string; slug: string; icon: string }> = [];

  if (user) {
    const { data: student } = await service
      .from('students')
      .select('first_name')
      .eq('id', user.id)
      .single();

    if (student?.first_name) {
      firstName = student.first_name;
    }

    const { data: studentSubjs } = await service
      .from('student_subjects')
      .select('subject_id, subjects(id, name, slug, icon_name)')
      .eq('student_id', user.id);

    if (studentSubjs && studentSubjs.length > 0) {
      enrolledSubjects = studentSubjs.map((ss: any) => ({
        id: ss.subjects?.id || ss.subject_id,
        name: ss.subjects?.name || 'AP Subject',
        slug: ss.subjects?.slug || 'ap-course',
        icon: ss.subjects?.icon_name || '📚',
      }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Welcome Header */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {enrolledSubjects.length > 0
              ? `You're set up for ${enrolledSubjects.length} AP subject${enrolledSubjects.length > 1 ? 's' : ''}.`
              : "You haven't enrolled in any AP subjects yet."}
          </p>
        </div>

        {/* Onboarding Progress Step Indicator */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Your Preparation Path
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center space-x-3 rounded-lg border-2 border-indigo-600 bg-indigo-50/50 p-4 dark:border-indigo-500 dark:bg-indigo-950/30">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                1
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Take Diagnostic</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Identify your skill baseline</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-slate-50 p-4 opacity-60 dark:border-slate-700 dark:bg-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                2
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Daily Practice</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Target weak topic areas</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-slate-50 p-4 opacity-60 dark:border-slate-700 dark:bg-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                3
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Track Score</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Monitor predicted AP score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Subject Cards or Client Fallback */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Your Enrolled Subjects
          </h2>

          <DashboardSubjects initialSubjects={enrolledSubjects} />
        </div>
      </div>
    </div>
  );
}
