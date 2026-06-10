/**
 * POST /api/onboarding/parental-consent-request
 *
 * S1-F-03 — Age Gate & Parental Consent
 * S1-F-09 — Parental Consent Email
 *
 * Creates a parental_consent_requests record and queues the consent email.
 * Called when a student under 18 enters their parent's email at the age gate.
 *
 * Request body:
 *   {
 *     parent_email: string (email address of parent/guardian)
 *   }
 *
 * Response contract:
 *   201: { success: true, consent_request_id: "uuid", parent_email: "..." }
 *   400: { error: "VALIDATION_ERROR", fields: { ... } }
 *   409: { error: "CONSENT_ALREADY_PENDING" }
 *   500: { error: "INTERNAL_ERROR" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  parent_email: z.string().email('Invalid parent email address'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

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

    // Check if consent request already exists
    const { data: existing } = await supabase
      .from('parental_consent_requests')
      .select('id, status')
      .eq('student_id', user.id)
      .single();

    if (existing && existing.status === 'pending') {
      return NextResponse.json(
        { error: 'CONSENT_ALREADY_PENDING', message: 'A consent request is already pending' },
        { status: 409 }
      );
    }

    // Create parental consent request
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    const { data: consentRequest, error: insertError } = await supabase
      .from('parental_consent_requests')
      .insert({
        student_id: user.id,
        parent_email,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !consentRequest) {
      console.error('[parental-consent-request]', insertError);
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to create consent request' },
        { status: 500 }
      );
    }

    // Queue the consent email (S1-F-09)
    // The email will be sent asynchronously by Resend
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send-parental-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          parent_email,
          consent_request_id: consentRequest.id,
        }),
      });
    } catch (err) {
      // Log email error but don't fail the request
      console.error('[parental-consent-request] Email send failed:', err);
    }

    return NextResponse.json(
      {
        success: true,
        consent_request_id: consentRequest.id,
        parent_email,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/onboarding/parental-consent-request]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
