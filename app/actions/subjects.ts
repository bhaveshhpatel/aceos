'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { LAUNCH_SUBJECTS_CATALOG } from '@/config/subjects_catalog';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'
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

  // Fetch subjects by slugs from catalog table
  const { data: subjects, error: subError } = await service
    .from('subjects')
    .select('id, product_id, slug')
    .in('slug', subjectSlugs);

  // If subjects do not exist in DB yet, auto-seed them from LAUNCH_SUBJECTS_CATALOG
  if (!subjects || subjects.length < subjectSlugs.length) {
    for (const item of LAUNCH_SUBJECTS_CATALOG) {
      if (subjectSlugs.includes(item.slug)) {
        await service.from('subjects').upsert(
          {
            slug: item.slug,
            name: item.name,
            type: item.type,
            product_id: productId,
          },
          { onConflict: 'slug' }
        );
      }
    }
    const { data: refetched } = await service
      .from('subjects')
      .select('id, product_id, slug')
      .in('slug', subjectSlugs);
    subjects = refetched;
  }

  if (subjects && subjects.length > 0) {
    // Delete previous selections for this student to allow re-selection without unique constraint error
    await service.from('student_subjects').delete().eq('student_id', user.id);

    const inserts = subjects.map((sub) => ({
      student_id: user.id,
      subject_id: sub.id,
      product_id: sub.product_id || productId,
    }));
    await service.from('student_subjects').insert(inserts);
  }

  // Update student onboarding_completed status to unblock navigation
  await service.from('students').update({ onboarding_completed: true }).eq('id', user.id);

  return { success: true };
}
