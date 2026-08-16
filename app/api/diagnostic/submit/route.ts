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
    const { subject_slug, answers } = body; // answers: Array<{ question_id: string, unit_id: string, correct: boolean }>

    if (!subject_slug || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    }

    const totalQuestions = answers.length;
    const correctCount = answers.filter((a) => a.correct).length;
    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Calculate predicted AP score (1-5 scale)
    let predictedApScore = 1;
    if (scorePercentage >= 85) predictedApScore = 5;
    else if (scorePercentage >= 70) predictedApScore = 4;
    else if (scorePercentage >= 55) predictedApScore = 3;
    else if (scorePercentage >= 40) predictedApScore = 2;

    // Aggregate unit mastery map
    const unitMasteryMap: Record<string, { correct: number; total: number; mastery_pct: number }> = {};
    answers.forEach((ans) => {
      const unit = ans.unit_id || 'unit_1';
      if (!unitMasteryMap[unit]) {
        unitMasteryMap[unit] = { correct: 0, total: 0, mastery_pct: 0 };
      }
      unitMasteryMap[unit].total += 1;
      if (ans.correct) unitMasteryMap[unit].correct += 1;
    });

    Object.keys(unitMasteryMap).forEach((unit) => {
      const u = unitMasteryMap[unit];
      u.mastery_pct = Math.round((u.correct / u.total) * 100);
    });

    const service = serviceClient();

    // Upsert into student_intelligence_profiles
    const { error: sipError } = await service.from('student_intelligence_profiles').upsert(
      {
        student_id: user.id,
        predicted_ap_score: predictedApScore,
        mastery_map: unitMasteryMap,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' }
    );

    if (sipError) {
      console.error('[diagnostic/submit] SIP update error:', sipError);
    }

    return NextResponse.json({
      success: true,
      total_questions: totalQuestions,
      correct_count: correctCount,
      score_percentage: Math.round(scorePercentage),
      predicted_ap_score: predictedApScore,
      unit_mastery: unitMasteryMap,
    });
  } catch (err) {
    console.error('[POST /api/diagnostic/submit]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
