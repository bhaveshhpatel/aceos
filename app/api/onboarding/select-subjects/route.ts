/**
 * POST /api/onboarding/select-subjects
 *
 * S1-F-05 — AP Subject Selection
 *
 * Saves student's selected AP subjects and initializes SIP records.
 * Called after age gate/parental consent is complete.
 *
 * Request body:
 *   {
 *     subject_ids: string[] (array of AP subject UUIDs, 1-6 items)
 *   }
 *
 * Response contract:
 *   201: { success: true, subjects_selected: number }
 *   400: { error: "VALIDATION_ERROR", fields: { ... } }
 *   500: { error: "INTERNAL_ERROR" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  subject_ids: z.array(z.string().uuid()).min(1).max(6),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { subject_ids } = parsed.data;

    // Fetch subject names for SIP initialization
    const { data: subjects, error: subjectsError } = await supabase
      .from('ap_subjects')
      .select('id, name')
      .in('id', subject_ids);

    if (subjectsError || !subjects || subjects.length !== subject_ids.length) {
      return NextResponse.json(
        { error: 'INVALID_SUBJECTS', message: 'One or more subjects not found' },
        { status: 400 }
      );
    }

    // Create student_ap_subjects records
    const { error: subjectSelectionError } = await supabase
      .from('student_ap_subjects')
      .insert(
        subject_ids.map((subjectId) => ({
          student_id: user.id,
          ap_subject_id: subjectId,
          selected_at: new Date().toISOString(),
        }))
      );

    if (subjectSelectionError) {
      console.error('[select-subjects]', subjectSelectionError);
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to save subject selections' },
        { status: 500 }
      );
    }

    // Initialize SIP records for each subject
    const { error: sipError } = await supabase
      .from('sip_records')
      .insert(
        subjects.map((subject) => ({
          student_id: user.id,
          ap_subject: subject.name,
          mastery: 0.0,
          units_mastery: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );

    if (sipError) {
      console.error('[select-subjects] SIP insert error:', sipError);
      // Don't fail — SIP records can be initialized later if needed
    }

    // Update student record: mark onboarding as complete, update account_status to active
    const { error: studentUpdateError } = await supabase
      .from('students')
      .update({
        account_status: 'active',
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (studentUpdateError) {
      console.error('[select-subjects] Student update error:', studentUpdateError);
      // Log but don't fail
    }

    // Log the event
    await supabase.from('audit_logs').insert({
      student_id: user.id,
      action: 'subjects_selected',
      details: { count: subject_ids.length, subject_ids },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        subjects_selected: subjects.length,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/onboarding/select-subjects]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
