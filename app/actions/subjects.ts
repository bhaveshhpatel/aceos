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

  // Ensure default product row exists
  let productId = '00000000-0000-0000-0000-000000000001';
  const { data: existingProd } = await service
    .from('products')
    .select('id')
    .eq('slug', 'score-boost-ap')
    .maybeSingle();

  if (existingProd?.id) {
    productId = existingProd.id;
  } else {
    const { data: newProd } = await service
      .from('products')
      .insert({
        slug: 'score-boost-ap',
        name: 'ScoreBoost AP',
      })
      .select('id')
      .maybeSingle();
    if (newProd?.id) {
      productId = newProd.id;
    }
  }

  // Fetch subjects by slugs from DB table
  let { data: subjects } = await service
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
            icon_name: item.icon,
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
