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

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      // AC-03b: server-side Zod rejection — SCREAMING_SNAKE_CASE, fields not issues
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
        // AC-02: duplicate email
        return NextResponse.json(
          { error: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists. Sign in instead?' },
          { status: 409 }
        );
      }
      throw authError;
    }

    const userId        = authData.user.id;
    const age           = getAgeFromDob(dob);
    const accountStatus = age >= 18 ? 'active' : 'pending_age_check';

    // 2. Insert students row
    // AC-06: all load-bearing columns must be explicitly set — never rely on DB defaults
    // for fields that drive downstream routing (account_status, onboarding_completed, parent_email).
    const { error: studentError } = await supabase.from('students').insert({
      id:                   userId,
      email,
      first_name,
      last_name,
      dob,
      account_status:       accountStatus,
      email_verified:       false,
      onboarding_completed: false,   // AC-06: explicit — drives /onboarding redirect logic
      parent_email:         null,    // AC-06: explicit null — set later by POST /api/auth/consent/send
    });

    if (studentError) {
      // AC-07: atomic rollback — delete the auth user so the email is not ghost-locked
      await supabase.auth.admin.deleteUser(userId);
      // AC-07: return SIGNUP_FAILED — never forward raw DB error to client
      return NextResponse.json(
        { error: 'SIGNUP_FAILED', message: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // 3. Log ToS + Privacy Policy consent (document_version: '1.0' per T1.4 spec)
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
    const ua = request.headers.get('user-agent') ?? null;

    await supabase.from('consent_log').insert([
      {
        student_id:       userId,
        event_type:       'tos_accepted',
        document_version: '1.0',
        actor_email:      email,
        ip_address:       ip,
        user_agent:       ua,
      },
      {
        student_id:       userId,
        event_type:       'privacy_policy_accepted',
        document_version: '1.0',
        actor_email:      email,
        ip_address:       ip,
        user_agent:       ua,
      },
    ]);

    // 4. Log age verification event for adults (document_version: NULL per T1.4 spec)
    if (accountStatus === 'active') {
      await supabase.from('consent_log').insert({
        student_id:       userId,
        event_type:       'age_verified_adult',
        document_version: null,
        actor_email:      email,
        ip_address:       ip,
        user_agent:       ua,
      });
    }

    // 5. Generate verification link (S1-F-04 ownership).
    //    type: 'signup' — generates an email verification link (sets email_confirmed_at on click).
    //    NOT 'magiclink' — that generates a passwordless sign-in link and does NOT verify email.
    //    /auth/callback reads account_status from DB and routes:
    //      active            → /onboarding/subjects
    //      pending_age_check → /onboarding/consent
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      // Rollback — user exists in auth but we cannot deliver the verification email
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'SIGNUP_FAILED', message: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Deliver verification email via Resend.
    //    action_link is the full Supabase verification URL including the OTP token.
    //    Supabase Auth email sending must be DISABLED in the dashboard so only this call sends.
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
      // Rollback — verification link generated but email delivery failed
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
