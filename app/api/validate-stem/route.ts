/**
 * POST /api/validate-stem
 * TS2-01 — Modal.com Python Sandbox Deployment
 *
 * Authenticated route. Calls Modal sandbox for STEM answer validation.
 * Returns correct: null (not HTTP error) when Modal is unavailable —
 * client must handle gracefully and NOT block the student.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callModalSandbox } from '@/lib/ai/modal/callModalSandbox';
import { handleAIError } from '@/lib/ai/handleAIError';
import type { STEMValidationRequest } from '@/types/modal';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: STEMValidationRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.student_answer || !body.correct_answer || !body.subject_type) {
    return NextResponse.json(
      { error: 'Missing required fields: student_answer, correct_answer, subject_type' },
      { status: 400 }
    );
  }

  try {
    const result = await callModalSandbox(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleAIError(error, { student_id: user.id });
  }
}
