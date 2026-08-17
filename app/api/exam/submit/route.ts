import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const { subject_slug, time_spent_seconds, answers } = body;

    if (!subject_slug || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    }

    const totalQuestions = answers.length;
    const correctCount = answers.filter((a: any) => a.correct).length;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    let apScore = 1;
    if (percentage >= 80) apScore = 5;
    else if (percentage >= 65) apScore = 4;
    else if (percentage >= 50) apScore = 3;
    else if (percentage >= 35) apScore = 2;

    const service = serviceClient();

    // Log exam attempt in student_intelligence_profiles
    await service.from('student_intelligence_profiles').upsert(
      {
        student_id: user.id,
        predicted_ap_score: apScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' }
    );

    return NextResponse.json({
      success: true,
      total_questions: totalQuestions,
      correct_count: correctCount,
      percentage: Math.round(percentage),
      predicted_ap_score: apScore,
      time_spent_seconds,
    });
  } catch (err) {
    console.error('[POST /api/exam/submit]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
