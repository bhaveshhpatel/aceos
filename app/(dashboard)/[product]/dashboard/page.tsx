/**
 * /[product]/dashboard
 * S1-F-06 — Student Dashboard Shell
 *
 * Product-scoped dashboard. Shows:
 * - Student welcome screen
 * - Selected AP subjects
 * - Action cards (Diagnostic, Settings, Help)
 * - Navigation menu for future features
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/features/dashboard/DashboardShell';
import { DashboardContent } from '@/components/features/dashboard/DashboardContent';

export const metadata: Metadata = {
  title: 'Dashboard — AceOS',
};

export default async function DashboardPage() {
  const supabase = createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/signin');
  }

  // Get student profile
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('first_name, last_name, account_status')
    .eq('id', user.id)
    .single();

  if (studentError || !student) {
    redirect('/signin');
  }

  // Redirect if not onboarded
  if (student.account_status !== 'active') {
    redirect('/onboarding/ap-calculus-ab/age-gate');
  }

  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';

  return (
    <DashboardShell student_name={studentName}>
      <DashboardContent student_name={studentName} />
    </DashboardShell>
  );
}
