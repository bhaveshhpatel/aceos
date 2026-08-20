import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { jwtVerify } from 'jose';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/auth/consent-expired`);
  }

  const jwtSecret = process.env.CONSENT_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-key-at-least-32-bytes-long!';
  const secretKey = new Uint8Array(Buffer.from(jwtSecret));

  let student_id: string;
  let parent_email: string;

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    student_id = payload.student_id as string;
    parent_email = payload.parent_email as string;
  } catch (err) {
    return NextResponse.redirect(`${baseUrl}/auth/consent-expired`);
  }

  const supabaseService = serviceClient();

  // Fetch student record
  const { data: student, error: studentError } = await supabaseService
    .from('students')
    .select('id, email, first_name, account_status')
    .eq('id', student_id)
    .single();

  if (studentError || !student) {
    return NextResponse.redirect(`${baseUrl}/auth/consent-expired`);
  }

  if (student.account_status === 'active' || student.account_status === 'declined') {
    return NextResponse.redirect(`${baseUrl}/auth/consent-already-actioned`);
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
  const ua = request.headers.get('user-agent') ?? null;

  // Update account_status to active
  const { error: updateError } = await supabaseService
    .from('students')
    .update({ account_status: 'active' })
    .eq('id', student_id);

  if (updateError) {
    return NextResponse.redirect(`${baseUrl}/auth/consent-expired`);
  }

  // Insert consent_granted in auth_event_log
  await supabaseService.from('auth_event_log').insert({
    student_id,
    event_type: 'consent_granted',
    actor_email: parent_email,
    ip_address: ip,
    user_agent: ua,
  });

  // Send confirmation email to student via Resend
  const resend = resendClient();
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: student.email,
    subject: 'Parental Consent Granted - Welcome to AceOS',
    html: `
      <p>Hi ${student.first_name},</p>
      <p>Great news! Your parent (${parent_email}) has approved your AceOS account.</p>
      <p>You can now sign in and select your AP subjects.</p>
      <p><a href="${baseUrl}/signin">Sign In to AceOS</a></p>
    `,
  }).catch((err) => console.error('[consent/approve] Email send error:', err));

  return NextResponse.redirect(`${baseUrl}/onboarding/subjects`);
}
