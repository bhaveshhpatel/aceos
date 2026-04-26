/**
 * Supabase OAuth + Email Verification callback handler.
 * Exchanges auth code for session, then routes the user to the
 * correct product-scoped onboarding or dashboard path.
 *
 * URL structure:
 *   /onboarding/[product]/age-gate   — e.g. /onboarding/score-boost-ap/age-gate
 *   /onboarding/[product]/subjects
 *   /[product]/dashboard             — e.g. /score-boost-ap/dashboard
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_PRODUCT = 'score-boost-ap';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code             = searchParams.get('code');
  const next             = searchParams.get('next');
  const product          = searchParams.get('product') ?? DEFAULT_PRODUCT;
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

  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    // Could be expired email verification link
    const isVerifyLink = next?.includes('age-gate');
    if (isVerifyLink) {
      return NextResponse.redirect(
        `${origin}/verify-email?expired=true&email=${encodeURIComponent(data?.user?.email ?? '')}`
      );
    }
    return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
  }

  // Check if this is a new OAuth user who needs a student row
  const { data: student } = await supabase
    .from('students')
    .select('id, onboarding_completed, account_status')
    .eq('id', data.user.id)
    .single();

  if (!student) {
    // New OAuth user — create student row, send to product-scoped onboarding
    await supabase.from('students').insert({
      id:              data.user.id,
      email:           data.user.email,
      first_name:      data.user.user_metadata?.full_name?.split(' ')[0] ?? '',
      last_name:       data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
      email_verified:  true,
      account_status:  'pending_age_check',
    });
    return NextResponse.redirect(`${origin}/onboarding/${product}/age-gate`);
  }

  if (!student.onboarding_completed) {
    return NextResponse.redirect(`${origin}/onboarding/${product}/age-gate`);
  }

  // Respect explicit `next` param, else go to product dashboard
  const destination = next ?? `/${product}/dashboard`;
  return NextResponse.redirect(`${origin}${destination}`);
}
