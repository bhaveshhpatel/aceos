/**
 * GET /auth/verify-session
 *
 * Lightweight server route called by the client-side callback page
 * (app/auth/callback/page.tsx) after setSession() has established the
 * cookie session from an implicit-flow email verification.
 *
 * Reads the session, marks email_verified = true, writes auth_event_log,
 * then applies the T1.4 state-machine routing — identical logic to
 * the post-exchange block in app/auth/callback/route.ts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.redirect(`${origin}/signin?error=session_not_found`);
  }

  const userId = user.id;
  const admin  = serviceClient();

  const { data: student, error: studentFetchError } = await admin
    .from('students')
    .select('id, account_status, onboarding_completed, email_verified')
    .eq('id', userId)
    .single();

  // OAuth / unknown path — no students row yet
  if (studentFetchError || !student) {
    await admin.from('students').insert({
      id:                   userId,
      email:                user.email ?? '',
      first_name:           user.user_metadata?.full_name?.split(' ')[0] ?? '',
      last_name:            user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
      dob:                  null,
      account_status:       'pending_age_check',
      email_verified:       true,
      onboarding_completed: false,
      parent_email:         null,
    });
    return NextResponse.redirect(`${origin}/onboarding/consent`);
  }

  // Mark email verified + write event log (idempotent)
  if (!student.email_verified) {
    await admin
      .from('students')
      .update({ email_verified: true, updated_at: new Date().toISOString() })
      .eq('id', userId);

    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
    const ua = request.headers.get('user-agent') ?? null;

    await admin.from('auth_event_log').insert({
      student_id:  userId,
      event_type:  'email_verified',
      actor_email: user.email ?? null,
      ip_address:  ip,
      user_agent:  ua,
    });
  }

  // T1.4 state-machine routing
  switch (student.account_status) {
    case 'active':
      return NextResponse.redirect(`${origin}/onboarding/subjects`);
    case 'pending_age_check':
      return NextResponse.redirect(`${origin}/onboarding/consent`);
    case 'pending_consent':
      return NextResponse.redirect(`${origin}/onboarding/awaiting-consent`);
    case 'declined':
    case 'suspended':
      return NextResponse.redirect(`${origin}/signin?error=account_inactive`);
    default:
      return NextResponse.redirect(`${origin}/signin?error=unknown_status`);
  }
}
