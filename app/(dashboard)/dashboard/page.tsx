/**
 * /dashboard
 *
 * Redirect from /dashboard to /[product]/dashboard.
 * Uses the first selected AP subject as the default product.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardRedirect() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/signin');
  }

  // Get their first selected subject
  const { data: subjects } = await supabase
    .from('student_ap_subjects')
    .select(
      `
      ap_subject_id,
      ap_subjects:ap_subject_id (slug)
    `
    )
    .eq('student_id', user.id)
    .eq('is_active', true)
    .order('selected_at')
    .limit(1);

  // Default to AP Calculus if none found
  const productSlug = subjects?.[0]?.ap_subjects?.slug || 'ap-calculus-ab';

  redirect(`/${productSlug}/dashboard`);
}
