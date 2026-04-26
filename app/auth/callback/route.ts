/**
 * Supabase OAuth callback handler.
 * Handles Google OAuth redirect and email verification links.
 * Exchanges the code for a session, then routes the user appropriately.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // OAuth error returned from provider
  if (error) {
    const params = new URLSearchParams({ error: errorDescription ?? error });
    return NextResponse.redirect(`${origin}/signin?${params}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`);
  }

  const supabase = createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
  }

  // Check if this is a new OAuth user who needs onboarding
  const { data: student } = await supabase
    .from('students')
    .select('id, onboarding_completed')
    .eq('id', data.user.id)
    .single();

  if (!student) {
    // New OAuth user — create student row and send to onboarding
    await supabase.from('students').insert({
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.user_metadata?.full_name?.split(' ')[0] ?? '',
      last_name:  data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
      email_verified: true,
      account_status: 'pending_age_check',
    });
    return NextResponse.redirect(`${origin}/onboarding/age-gate`);
  }

  if (!student.onboarding_completed) {
    return NextResponse.redirect(`${origin}/onboarding/age-gate`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
