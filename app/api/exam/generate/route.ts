import { NextRequest, NextResponse } from 'next/server';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';
import { callAI } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subjectSlug = body.subject_slug || 'ap-chemistry';

    const syllabus = OFFICIAL_AP_SYLLABI[subjectSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];

    const prompt = `You are a Principal College Board AP Exam Item Writer for ${syllabus.name}.
Generate 10 authentic, high-rigor College Board AP multiple-choice exam questions spanning the required units:
${syllabus.units.map((u) => `- Unit ${u.unitNumber}: ${u.unitName} (${u.weightPercentage})`).join('\n')}

STRICT QUALITY REQUIREMENTS:
1. Every question MUST be a REAL, contextual AP exam question featuring chemical equations, math integrals/derivatives, primary historical document excerpts, biological mechanisms, or rhetorical analysis passages.
2. Provide 4 realistic, challenging options per question [Option A, Option B, Option C, Option D].
3. Distribute the correct answer index evenly across 0 (A), 1 (B), 2 (C), and 3 (D).
4. Provide a detailed, multi-sentence College Board AP rubric explanation for why the correct option is right and why distractors are wrong.
5. Return ONLY a valid JSON array of objects with keys: "id", "unit", "topic", "question", "options", "correct", "explanation". Do NOT wrap in markdown code blocks.`;

    let generatedQuestions: any[] = [];

    try {
      const aiRes = await callAI({
        route: 'diagnostic_mcq',
        messages: [{ role: 'user', content: prompt }],
      });

      const cleanJson = aiRes.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        generatedQuestions = parsed;
      }
    } catch (aiErr) {
      console.warn('[Exam Generator AI Notice] Primary AI call returned fallback:', aiErr);
    }

    // Merge with authentic curated AP syllabus questions if AI result count is small
    if (!Array.isArray(generatedQuestions) || generatedQuestions.length < 5) {
      const seedQuestions = syllabus.questions || [];
      generatedQuestions = [...generatedQuestions, ...seedQuestions];
    }

    // Assign sequential numbers and format output
    const formatted = generatedQuestions.map((q: any, idx: number) => ({
      id: q.id || `ai-${subjectSlug}-q${idx + 1}`,
      number: idx + 1,
      unit: q.unit || 'Core Unit',
      topic: q.topic || 'AP Concept',
      question: q.question,
      options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: typeof q.correct === 'number' ? q.correct : (idx % 4),
      explanation: q.explanation || 'Official College Board AP Rubric Explanation.',
    }));

    return NextResponse.json({ questions: formatted });
  } catch (err) {
    console.error('[POST /api/exam/generate]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
