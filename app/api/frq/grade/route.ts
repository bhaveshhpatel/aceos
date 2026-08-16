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

    const { system, user: userPrompt } = renderPrompt('frq_humanities_grader', {
      subject: subject_slug || 'AP US History',
      frq_type: 'LEQ',
      prompt: 'Evaluate the causes of the Civil War.',
      rubric: 'Thesis (1 pt), Evidence (2 pts), Analysis (2 pts)',
      student_response: essay_text,
    });

    const aiResponse = await callAI({
      route: 'frq_grading',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      metadata: { student_id: user.id },
    });

    const parsedGrading = parseGradingResponse(aiResponse.content);

    return NextResponse.json(parsedGrading);
  } catch (err) {
    return handleAIError(err, { route: 'frq_grading' });
  }
}
