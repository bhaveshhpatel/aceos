/**
 * Student Intelligence Profile (SIP)
 * The central data object shared across all AceOS products.
 *
 * Every module (ScoreBoost AP, GradeGuard, StudySensei, SmartPack)
 * reads from and writes to the SIP. Never bypass this layer
 * to query mastery_map or student data directly in components.
 *
 * This is a scaffold — methods are implemented as each sprint requires them.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MasteryEntry {
  mastery:       number;   // 0.0 – 1.0
  last_reviewed: string;   // ISO date
  fsrs_due:      string;   // ISO date
}

export interface SIP {
  student_id:           string;
  product_id:           string;
  ap_subjects:          string[];
  mastery_map:          Record<string, Record<string, MasteryEntry>>;
  predicted_ap_scores:  Record<string, number>;
  gpa: {
    current:                 number;
    projected_semester_end:  number;
    target:                  number;
  } | null;
  ace_rank:       Record<string, number>;
  study_patterns: {
    avg_session_length_minutes: number;
    peak_study_hour:            number;
    sessions_per_week:          number;
  } | null;
}

/**
 * Fetch the SIP for a student + product combination.
 * Returns null if no data exists yet (new student).
 */
export async function getSIP(
  supabase: SupabaseClient,
  studentId: string,
  productSlug: string = 'score-boost-ap'
): Promise<SIP | null> {
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      student_subjects (
        subject:subjects ( name, slug, product:products ( slug ) )
      ),
      mastery_map (
        subject_id,
        unit_slug,
        mastery_score,
        last_reviewed_at,
        fsrs_due_at,
        product:products ( slug )
      )
    `)
    .eq('id', studentId)
    .single();

  if (error || !student) return null;

  // Filter to requested product only
  const subjects = (student.student_subjects ?? [])
    .filter((ss: any) => ss.subject?.product?.slug === productSlug)
    .map((ss: any) => ss.subject?.name as string)
    .filter(Boolean);

  const masteryMap: SIP['mastery_map'] = {};
  for (const row of (student.mastery_map ?? [])) {
    if ((row as any).product?.slug !== productSlug) continue;
    const subjectSlug = (row as any).subject_id;
    const unitSlug    = (row as any).unit_slug;
    if (!masteryMap[subjectSlug]) masteryMap[subjectSlug] = {};
    masteryMap[subjectSlug][unitSlug] = {
      mastery:       (row as any).mastery_score,
      last_reviewed: (row as any).last_reviewed_at,
      fsrs_due:      (row as any).fsrs_due_at,
    };
  }

  return {
    student_id:          studentId,
    product_id:          productSlug,
    ap_subjects:         subjects,
    mastery_map:         masteryMap,
    predicted_ap_scores: {},
    gpa:                 null,
    ace_rank:            {},
    study_patterns:      null,
  };
}
