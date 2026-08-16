import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/auth/consent-expired`);
  }

  const jwtSecret = process.env.CONSENT_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-key-min-32-chars';
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
    .select('id, account_status')
    .eq('id', student_id)
    .single();

  if (studentError || !student) {
    return NextResponse.redirect(`${baseUrl}/auth/consent-expired`);
  }

  if (!['pending_age_check', 'pending_consent'].includes(student.account_status)) {
    return NextResponse.redirect(`${baseUrl}/auth/consent-already-actioned`);
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
  const ua = request.headers.get('user-agent') ?? null;

  // Update account_status to declined
  await supabaseService
    .from('students')
    .update({ account_status: 'declined' })
    .eq('id', student_id);

  // Insert consent_denied in auth_event_log
  await supabaseService.from('auth_event_log').insert({
    student_id,
    event_type: 'consent_denied',
    actor_email: parent_email,
    ip_address: ip,
    user_agent: ua,
  });

  // FERPA hard delete of auth.users record
  await supabaseService.auth.admin.deleteUser(student_id);

  return NextResponse.redirect(`${baseUrl}/auth/consent-already-actioned`);
}
