/**
 * POST /api/auth/signin
 * Handles email + password sign-in.
 * Sets the session cookie via the SSR client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signInSchema } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Generic message — never reveal whether email exists (AC-02 S1-F-10 pattern)
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    // Check email verification
    if (!data.user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'email_not_verified', message: 'Please verify your email before signing in.' },
        { status: 403 }
      );
    }

    // Fetch account status
    const { data: student } = await supabase
      .from('students')
      .select('account_status, onboarding_completed')
      .eq('id', data.user.id)
      .single();

    if (student?.account_status === 'pending_consent') {
      return NextResponse.json(
        { error: 'pending_consent', message: 'Your account is awaiting parental approval.' },
        { status: 403 }
      );
    }

    if (student?.account_status === 'declined') {
      return NextResponse.json(
        { error: 'account_declined', message: 'Your account could not be activated. Please speak with your parent or guardian.' },
        { status: 403 }
      );
    }

    const redirectTo = student?.onboarding_completed ? '/dashboard' : '/onboarding/subjects';
    return NextResponse.json({ success: true, redirectTo }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/signin]', err);
    return NextResponse.json(
      { error: 'internal_error', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
