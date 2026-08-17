'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function saveSubjectSelections(subjectSlugs: string[]) {
  if (!subjectSlugs || subjectSlugs.length < 1 || subjectSlugs.length > 4) {
    return { success: false, error: 'Please select between 1 and 4 subjects.' };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const service = serviceClient();

  // Fetch subjects by slugs
  const { data: subjects, error: subError } = await service
    .from('subjects')
    .select('id, product_id, slug')
    .in('slug', subjectSlugs);

  if (!subError && subjects && subjects.length > 0) {
    const inserts = subjects.map((sub) => ({
      student_id: user.id,
      subject_id: sub.id,
      product_id: sub.product_id,
    }));
    await service.from('student_subjects').insert(inserts);
  }

  // Always mark onboarding_completed = true to unblock onboarding flow
  await service.from('students').update({ onboarding_completed: true }).eq('id', user.id);

  return { success: true };
}
