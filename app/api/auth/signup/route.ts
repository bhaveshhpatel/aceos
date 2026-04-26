/**
 * POST /api/auth/signup
 * S1-F-01 — Email Sign-Up
 *
 * Creates a Supabase Auth user, inserts the students row,
 * logs ToS + Privacy Policy consent, and triggers email verification.
 *
 * Uses the service-role client so it can bypass RLS for the INSERT.
 * Never expose the service-role key to the browser.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { signUpSchema } from '@/types/auth';
import { getAgeFromDob } from '@/lib/utils';

const DEFAULT_PRODUCT = 'score-boost-ap';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { first_name, last_name, email, password, dob } = parsed.data;
    const product = (body.product as string | undefined) ?? DEFAULT_PRODUCT;
    const supabase = serviceClient();

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { first_name, last_name },
    });

    if (authError) {
      if (
        authError.message.toLowerCase().includes('already') ||
        authError.message.toLowerCase().includes('duplicate') ||
        authError.code === '23505'
      ) {
        return NextResponse.json(
          { error: 'duplicate_email', message: 'An account with this email already exists. Sign in instead?' },
          { status: 409 }
        );
      }
      throw authError;
    }

    const userId        = authData.user.id;
    const age           = getAgeFromDob(dob);
    const accountStatus = age >= 18 ? 'active' : 'pending_age_check';

    // 2. Insert students row
    const { error: studentError } = await supabase.from('students').insert({
      id: userId,
      email,
      first_name,
      last_name,
      dob,
      account_status: accountStatus,
      email_verified: false,
    });

    if (studentError) {
      await supabase.auth.admin.deleteUser(userId);
      throw studentError;
    }

    // 3. Log ToS + Privacy Policy consent
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
    const ua = request.headers.get('user-agent') ?? null;

    await supabase.from('consent_log').insert([
      { student_id: userId, document_type: 'terms_of_service', version: '1.0', ip_address: ip, user_agent: ua },
      { student_id: userId, document_type: 'privacy_policy',   version: '1.0', ip_address: ip, user_agent: ua },
    ]);

    // 4. Send verification email — redirect to product-scoped onboarding
    await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?product=${product}&next=/onboarding/${product}/age-gate`,
      },
    });

    return NextResponse.json({ success: true, underage: age < 18 }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/signup]', err);
    return NextResponse.json(
      { error: 'internal_error', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
