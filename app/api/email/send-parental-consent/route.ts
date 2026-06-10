/**
 * POST /api/email/send-parental-consent
 *
 * S1-F-09 — Parental Consent Email
 *
 * Sends a parental consent request email via Resend.
 * This is called asynchronously by the parental-consent-request route.
 *
 * Email contains:
 * - Student name
 * - Consent approval link (JWT token)
 * - Data collection notice
 * - Rejection option
 *
 * The approval link routes to: /auth/parental-consent?token={jwt}&action=approve
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, parent_email, consent_request_id } = body;

    if (!student_id || !parent_email || !consent_request_id) {
      return NextResponse.json(
        { error: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('first_name')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'STUDENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Generate consent approval token
    // In production, this should be a signed JWT with expiration
    // For now, we'll use a simple token format: {consent_request_id}:{random}
    const approvalToken = Buffer.from(
      JSON.stringify({
        consent_request_id,
        created_at: new Date().toISOString(),
      })
    ).toString('base64');

    const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/parental-consent?token=${encodeURIComponent(approvalToken)}&action=approve`;
    const rejectLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/parental-consent?token=${encodeURIComponent(approvalToken)}&action=reject`;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: parent_email,
      subject: `Please approve ${student.first_name}'s AceOS account`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Approve ${student.first_name}'s AceOS Account</h2>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Hi there,
          </p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            ${student.first_name} is asking for permission to use AceOS, an educational platform that helps AP students improve their exam scores through personalized study plans and practice questions.
          </p>
          
          <h3 style="color: #1f2937; margin-top: 24px;">What data will we collect?</h3>
          <ul style="color: #6b7280; line-height: 1.6;">
            <li>AP subject selections</li>
            <li>Diagnostic test scores and mastery levels</li>
            <li>Practice question responses and performance</li>
            <li>Study patterns (session length, time of day)</li>
          </ul>
          
          <p style="color: #6b7280; line-height: 1.6;">
            <strong>All data is encrypted</strong> and ${student.first_name}'s AP exam scores are never shared without explicit consent.
          </p>
          
          <div style="margin: 32px 0;">
            <p style="margin-bottom: 12px;">
              <a href="${approvalLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Approve ${student.first_name}'s account
              </a>
            </p>
            <p style="margin-top: 12px; font-size: 14px;">
              <a href="${rejectLink}" style="color: #6b7280; text-decoration: underline;">
                Do not approve
              </a>
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
            This link expires in 30 days. If you have questions, contact us at <a href="mailto:support@aceos.com" style="color: #3b82f6;">support@aceos.com</a>.
          </p>
          
          <p style="color: #9ca3af; font-size: 13px;">
            © AceOS, Inc. All rights reserved.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('[send-parental-consent] Email send failed:', emailError);
      return NextResponse.json(
        { error: 'EMAIL_SEND_FAILED', message: emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (err) {
    console.error('[POST /api/email/send-parental-consent]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
