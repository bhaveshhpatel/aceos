/**
 * GET /api/auth/verify-session
 *
 * S1-F-04 — Email Verification flow completion
 * 
 * Called after the user clicks the email verification link and the session is set.
 * This route checks the authenticated user's account status and returns the
 * appropriate redirect destination.
 *
 * State machine (T1.4):
 *   pending_email_verification → (email verified by Supabase) → pending_age_check (minors) OR active (adults)
 *   pending_age_check → (parent approves) → active
 *   active → (proceed to onboarding/subjects) → dashboard
 *
 * Response contract:
 *   200: { redirect_to: "/onboarding/age-gate" | "/onboarding/subjects" | "/dashboard" }
 *   401: { error: "UNAUTHORIZED" } — no authenticated session
 *   500: { error: "INTERNAL_ERROR" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
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

    // Fetch the student profile to check account_status
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, account_status, dob, email_verified')
      .eq('id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Unable to load account status' },
        { status: 500 }
      );
    }

    // If user just completed email verification, update their account_status
    if (student.account_status === 'pending_email_verification' && user.email_confirmed_at) {
      const age = student.dob ? new Date().getFullYear() - new Date(student.dob).getFullYear() : null;
      const newStatus = age && age >= 18 ? 'active' : 'pending_age_check';

      // Update account status
      const { error: updateError } = await supabase
        .from('students')
        .update({ account_status: newStatus, email_verified: true })
        .eq('id', user.id);

      if (!updateError) {
        // Log email verification event
        await supabase.from('auth_event_log').insert({
          student_id: user.id,
          event_type: 'email_verified',
          actor_email: user.email,
          ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
          user_agent: request.headers.get('user-agent') ?? null,
        });

        // Log age verification event if adult
        if (newStatus === 'active') {
          await supabase.from('auth_event_log').insert({
            student_id: user.id,
            event_type: 'age_verified_adult',
            actor_email: user.email,
            ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
            user_agent: request.headers.get('user-agent') ?? null,
          });
        }

        // Update local student object to reflect new status
        Object.assign(student, { account_status: newStatus });
      }
    }

    // State machine routing
    let redirectTo = '/dashboard'; // default

    switch (student.account_status) {
      case 'pending_email_verification':
        // Email just got verified — route based on age
        redirectTo = student.dob ? '/onboarding/age-gate' : '/onboarding/subjects';
        break;

      case 'pending_age_check':
        // User is <18, awaiting parental consent
        redirectTo = '/onboarding/age-gate';
        break;

      case 'active':
        // Account is fully active — check if onboarding is complete
        const { data: subjects } = await supabase
          .from('student_ap_subjects')
          .select('id')
          .eq('student_id', user.id)
          .limit(1);

        if (!subjects || subjects.length === 0) {
          // No subjects selected yet
          redirectTo = '/onboarding/subjects';
        } else {
          // Subjects selected, go to dashboard
          redirectTo = '/dashboard';
        }
        break;

      case 'suspended':
        redirectTo = '/signin?error=account_suspended';
        break;

      default:
        // Unknown status — default to dashboard but log it
        console.warn(
          `[verify-session] Unknown account_status: ${student.account_status} for user ${user.id}`
        );
        redirectTo = '/dashboard';
    }

    return NextResponse.json(
      { redirect_to: redirectTo },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/auth/verify-session]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
