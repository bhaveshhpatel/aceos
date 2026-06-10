/**
 * POST /api/auth/signup
 * S1-F-01 — Email Sign-Up
 *
 * Creates a Supabase Auth user, inserts the students row,
 * logs ToS + Privacy Policy consent, generates a verification link,
 * and delivers it to the user via Resend.
 *
 * Email delivery is owned by S1-F-04. This route calls generateLink and
 * passes properties.action_link to Resend. Supabase Auth email sending
 * must be disabled in the dashboard (Auth → Settings) so only Resend delivers.
 *
 * Uses the service-role client so it can bypass RLS for the INSERT.
 * Never expose the service-role key to the browser.
 *
 * Two-log architecture (T1.4):
 *   consent_log      — legal document acceptance only (ToS, Privacy Policy)
 *   auth_event_log   — auth lifecycle events (age_verified_adult, email_verified, etc.)
 *
 * Error contract (T1.8 ApiError spec — SCREAMING_SNAKE_CASE):
 *   400 VALIDATION_ERROR      — Zod validation failed (fields contains per-field messages)
 *   409 EMAIL_ALREADY_EXISTS  — duplicate email
 *   500 SIGNUP_FAILED         — students insert failed after auth user created (rollback triggered)
 *   500 INTERNAL_ERROR        — any other unexpected failure
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { signUpSchema } from '@/types/auth';
import { getAgeFromDob } from '@/lib/utils';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Resend is intentionally NOT instantiated at module level.
// new Resend() runs at module evaluation time which Next.js triggers during
// build — before RESEND_API_KEY is available — causing a build crash.
// Instantiate inside the handler so it only runs at request time.
function resendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { first_name, last_name, email, password, dob } = parsed.data;
    const supabase = serviceClient();

    // 1. Create Supabase Auth user (email_confirm: false — we send the link manually below)
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
        (authError as any).code === '23505'
      ) {
        return NextResponse.json(
          { error: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists. Sign in instead?' },
          { status: 409 }
        );
      }
      throw authError;
    }

    const userId        = authData.user.id;
    const age           = getAgeFromDob(dob);
    // Initially all users are pending_email_verification. After email verification,
    // the verify-session route will update this to 'active' (18+) or 'pending_age_check' (<18).
    const accountStatus = 'pending_email_verification';

    // 2. Insert students row
    const { error: studentError } = await supabase.from('students').insert({
      id:                   userId,
      email,
      first_name,
      last_name,
      dob,
      account_status:       accountStatus,
      email_verified:       false,
      onboarding_completed: false,
      parent_email:         null,
    });

    if (studentError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'SIGNUP_FAILED', message: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    const ip  = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
    const ua  = request.headers.get('user-agent') ?? null;
    const now = new Date().toISOString();

    // 3. Log ToS + Privacy Policy consent
    await supabase.from('consent_log').insert([
      {
        student_id:    userId,
        document_type: 'terms_of_service',
        version:       '1.0',
        accepted_at:   now,
        ip_address:    ip,
        user_agent:    ua,
      },
      {
        student_id:    userId,
        document_type: 'privacy_policy',
        version:       '1.0',
        accepted_at:   now,
        ip_address:    ip,
        user_agent:    ua,
      },
    ]);

    // 4. Log age verification event (adults only)
    if (accountStatus === 'active') {
      await supabase.from('auth_event_log').insert({
        student_id:  userId,
        event_type:  'age_verified_adult',
        actor_email: email,
        ip_address:  ip,
        user_agent:  ua,
      });
    }

    // 5. Generate verification link
    //    type: 'signup' generates an email verification OTP link (NOT magiclink).
    //    password is required by GenerateSignupLinkParams type — runtime behaviour unchanged.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'SIGNUP_FAILED', message: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Deliver verification email via Resend
    const resend = resendClient();
    const { error: emailError } = await resend.emails.send({
      from:    'onboarding@resend.dev',
      to:      email,
      subject: 'Verify your AceOS email address',
      html: `
        <p>Hi ${first_name},</p>
        <p>Thanks for signing up for AceOS. Click the link below to verify your email address.</p>
        <p><a href="${linkData.properties.action_link}">Verify my email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });

    if (emailError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'SIGNUP_FAILED', message: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, underage: age < 18 }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/signup]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
