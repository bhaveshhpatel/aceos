import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

        {/* Enrolled Subject Cards or Empty State */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Your Enrolled Subjects
          </h2>

          {enrolledSubjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {enrolledSubjects.map((subject) => (
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

                  <div className="mt-6">
                    <Link
                      href={`/diagnostic/${subject.slug}`}
                      className="inline-block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Take Diagnostic
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
