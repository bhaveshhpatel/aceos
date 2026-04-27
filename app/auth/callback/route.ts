/**
 * Supabase Email Verification + OAuth callback handler.
 *
 * Exchanges the auth code for a session, marks email_verified = true,
 * writes auth_event_log { event_type: 'email_verified' }, then routes
 * the user based on account_status per the T1.4 state machine:
 *
 *   active            → /onboarding/subjects
 *   pending_age_check → /onboarding/consent
 *   pending_consent   → /onboarding/awaiting-consent
 *   declined          → /signin  (FERPA — no product access)
 *   suspended         → /signin
 *
 * If onboarding_completed = true the middleware will redirect away from
 * /onboarding/* automatically — no special-case needed here.
 *
 * OAuth new-user path:
 *   If no students row exists (Google OAuth first login), insert a stub
 *   row and send to /onboarding/consent so the age-gate flow runs.
 *   Full OAuth spec is T1.4b (Sprint 2).
 *
 * Uses service-role client for the UPDATE + INSERT so RLS does not block.
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
  const { searchParams, origin } = new URL(request.url);
  const code             = searchParams.get('code');
  const error            = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // OAuth error returned from provider
  if (error) {
    const params = new URLSearchParams({ error: errorDescription ?? error });
    return NextResponse.redirect(`${origin}/signin?${params}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`);
  }

  // Exchange code for session using anon client (cookie-based session)
  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    return NextResponse.redirect(
      `${origin}/verify-email?expired=true&email=${encodeURIComponent(data?.user?.email ?? '')}`
    );
  }

  const userId = data.user.id;
  const admin  = serviceClient();

  // ── Fetch current students row ────────────────────────────────────────────
  const { data: student, error: studentFetchError } = await admin
    .from('students')
    .select('id, account_status, onboarding_completed, email_verified')
    .eq('id', userId)
    .single();

  // ── OAuth new-user path (T1.4b — Sprint 2) ───────────────────────────────
  // If no students row exists this is a Google OAuth first login.
  // Insert a minimal stub and send to /onboarding/consent for the age-gate.
  if (studentFetchError || !student) {
    await admin.from('students').insert({
      id:                   userId,
      email:                data.user.email ?? '',
      first_name:           data.user.user_metadata?.full_name?.split(' ')[0] ?? '',
      last_name:            data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
      dob:                  null,
      account_status:       'pending_age_check',
      email_verified:       true,   // OAuth accounts arrive pre-verified
      onboarding_completed: false,
      parent_email:         null,
    });
    // No auth_event_log row here — age is unknown until age-gate form is submitted
    return NextResponse.redirect(`${origin}/onboarding/consent`);
  }

  // ── Mark email verified + write auth_event_log ───────────────────────────
  // Only write if not already verified (idempotent — handles link re-click).
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
      actor_email: data.user.email ?? null,
      ip_address:  ip,
      user_agent:  ua,
    });
  }

  // ── Route per T1.4 state machine ─────────────────────────────────────────
  // Middleware enforces the /onboarding/* namespace guard (onboarding_completed = true → /dashboard)
  // so we don't need to replicate that check here.
  switch (student.account_status) {
    case 'active':
      return NextResponse.redirect(`${origin}/onboarding/subjects`);

    case 'pending_age_check':
      return NextResponse.redirect(`${origin}/onboarding/consent`);

    case 'pending_consent':
      return NextResponse.redirect(`${origin}/onboarding/awaiting-consent`);

    case 'declined':
    case 'suspended':
      // No product access — FERPA / admin suspension
      return NextResponse.redirect(`${origin}/signin?error=account_inactive`);

    default:
      // Unknown status — fail safe to signin
      return NextResponse.redirect(`${origin}/signin?error=unknown_status`);
  }
}
