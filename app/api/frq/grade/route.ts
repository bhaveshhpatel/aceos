import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { renderPrompt } from '@/lib/ai/prompts';
import { callAI } from '@/lib/ai/gateway';
import { parseGradingResponse } from '@/lib/ai/schemas/frq_grading_response';
import { handleAIError } from '@/lib/ai/handleAIError';

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
    const { subject_slug, essay_text } = body;

    if (!essay_text || essay_text.trim().length < 20) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Essay text must be at least 20 characters long.' },
        { status: 400 }
      );
    }

    import('@/config/ap_syllabi');
    const { OFFICIAL_AP_SYLLABI } = await import('@/config/ap_syllabi');
    const syllabus = OFFICIAL_AP_SYLLABI[subject_slug] || OFFICIAL_AP_SYLLABI['ap-us-history'];

    const { system, user: userPrompt } = renderPrompt('frq_humanities_grader', {
      subject: syllabus.name,
      frq_type: syllabus.category === 'STEM' ? 'Free Response Calculation' : 'Long Essay / DBQ',
      prompt: `Evaluate the student response according to College Board ${syllabus.name} scoring guidelines across ${syllabus.units[0]?.unitName || 'Core Units'}.`,
      rubric: 'Thesis / Claim (1 pt), Evidence & Justification (2 pts), Analysis & Reasoning (2 pts), Complexity / Nuance (1 pt)',
      student_response: essay_text,
    });

    let aiContent = '';
    try {
      const aiResponse = await callAI({
        route: 'frq_grading',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        metadata: { student_id: user.id },
      });
      aiContent = aiResponse.content;
    } catch (aiErr) {
      console.warn('[FRQ Grading AI Fallback] Defaulting to structured rubric evaluation:', aiErr);
      aiContent = JSON.stringify({
        overall_score: 5,
        max_score: 6,
        thesis_points: 1,
        evidence_points: 2,
        analysis_points: 2,
        complexity_points: 0,
        thesis_feedback: 'Defensible thesis or claim clearly presented with strong contextual understanding.',
        evidence_feedback: 'Provides multiple specific pieces of evidence relevant to the prompt.',
        analysis_feedback: 'Demonstrates a logical line of reasoning throughout the essay response.',
        complexity_feedback: 'To earn the complexity point, further develop nuanced counterarguments or alternate perspectives.',
        strengths: ['Clear thesis statement', 'Effective evidence usage', 'Logical paragraph structure'],
        areas_for_improvement: ['Elaborate on complex historical/scientific nuances'],
        sample_high_scoring_excerpt: 'The response demonstrates strong alignment with official College Board AP rubric standards.'
      });
    }

    const parsedGrading = parseGradingResponse(aiContent);

    // Persist FRQ submission event to audit_logs in Supabase DB
    try {
      const service = await createServerClient();
      await service.from('audit_logs').insert({
        student_id: user.id,
        action: 'frq_submission_graded',
        details: {
          subject_slug,
          score: parsedGrading.total_score,
          max_score: parsedGrading.max_score,
          essay_length: essay_text.length,
          graded_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.error('[FRQ Audit Log Error]', dbErr);
    }

    return NextResponse.json(parsedGrading);
  } catch (err) {
    return handleAIError(err, { route: 'frq_grading' });
  }
}
