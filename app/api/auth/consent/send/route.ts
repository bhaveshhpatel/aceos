import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { SignJWT } from 'jose';
import { z } from 'zod';

const sendConsentSchema = z.object({
  parent_email: z.string().email('Please enter a valid email address'),
});

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sendConsentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { parent_email } = parsed.data;

    // Check user session
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be signed in to send parental consent requests.' },
        { status: 401 }
      );
    }

    const studentId = user.id;
    const supabaseService = serviceClient();

    // Check student record status
    const { data: student, error: studentFetchError } = await supabaseService
      .from('students')
      .select('first_name, account_status')
      .eq('id', studentId)
      .single();

    if (studentFetchError || !student) {
      return NextResponse.json(
        { error: 'STUDENT_NOT_FOUND', message: 'Student record not found.' },
        { status: 404 }
      );
    }

    if (!['pending_age_check', 'pending_consent'].includes(student.account_status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Account status does not require parental consent.' },
        { status: 400 }
      );
    }

    // Update students record
    const { error: updateError } = await supabaseService
      .from('students')
      .update({
        parent_email,
        account_status: 'pending_consent',
      })
      .eq('id', studentId);

    if (updateError) {
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: 'Failed to update parent email.' },
        { status: 500 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
    const ua = request.headers.get('user-agent') ?? null;

    // Log auth event
    await supabaseService.from('auth_event_log').insert({
      student_id: studentId,
      event_type: 'consent_email_sent',
      actor_email: parent_email,
      ip_address: ip,
      user_agent: ua,
    });

    // Generate signed consent JWT (7 day exp)
    const jwtSecret = process.env.CONSENT_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-key-min-32-chars';
    const secretKey = new Uint8Array(Buffer.from(jwtSecret));

    const token = await new SignJWT({ student_id: studentId, parent_email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approveUrl = `${baseUrl}/api/auth/consent/approve?token=${token}`;
    const denyUrl = `${baseUrl}/api/auth/consent/deny?token=${token}`;

    // Send email via Resend
    const resend = resendClient();
    const { error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: parent_email,
      subject: `Your approval is needed for ${student.first_name}'s AceOS account`,
      html: `
        <p>Hi,</p>
        <p>${student.first_name} (${user.email}) signed up for AceOS — an AI-powered AP exam prep platform.</p>
        <p>Because ${student.first_name} is under 18, we need your permission before storing any academic data.</p>
        <p><a href="${approveUrl}">APPROVE ACCESS</a></p>
        <p><a href="${denyUrl}">DECLINE ACCESS</a></p>
        <p>This link expires in 7 days.</p>
        <p>Privacy Policy: <a href="${baseUrl}/legal/privacy-policy">${baseUrl}/legal/privacy-policy</a></p>
      `,
    });

    if (emailError) {
      return NextResponse.json(
        { error: 'EMAIL_DELIVERY_FAILED', message: 'Failed to deliver consent email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/consent/send]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
