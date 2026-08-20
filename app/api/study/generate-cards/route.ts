import { NextRequest, NextResponse } from 'next/server';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';
import { callAI } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subjectSlug = body.subject_slug || 'ap-chemistry';

    const syllabus = OFFICIAL_AP_SYLLABI[subjectSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];

    const prompt = `You are an expert AP tutor for ${syllabus.name}.
Generate 8 authentic, high-quality flashcards for high school AP students covering:
${syllabus.units.map((u) => `- Unit ${u.unitNumber}: ${u.unitName}`).join('\n')}

REQUIREMENTS:
1. Return ONLY valid JSON as a JSON array of objects.
2. Each object must have keys:
   - "id": string (unique ID)
   - "unit": string (e.g. "Unit 1: Atomic Structure")
   - "topic": string (subtopic name)
   - "question": string (high-yield AP recall or conceptual question)
   - "answer": string (concise, accurate AP core concept or formula)
   - "explanation": string (detailed College Board AP rubric explanation)
3. Do NOT include Markdown code blocks or wrapping backticks. Output raw JSON array only.`;

    let generatedCards: any[] = [];
    try {
      const aiRes = await callAI({
        route: 'study_plan_generation',
        messages: [{ role: 'user', content: prompt }],
      });

      const cleanJson = aiRes.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        generatedCards = parsed;
      }
    } catch (aiErr) {
      console.warn('[Card Generator AI Notice] Primary AI call returned fallback:', aiErr);
    }

    if (!Array.isArray(generatedCards) || generatedCards.length < 4) {
      const seedCards = syllabus.flashcards || [];
      generatedCards = [...generatedCards, ...seedCards];
    }

    const formatted = generatedCards.map((c: any, idx: number) => ({
      id: c.id || `card-${subjectSlug}-${idx + 1}`,
      unit: c.unit || 'AP Core Unit',
      topic: c.topic || 'Core Concept',
      question: c.question,
      answer: c.answer,
      explanation: c.explanation || 'Official College Board AP Rubric Explanation.',
    }));

    return NextResponse.json({ cards: formatted });
  } catch (err) {
    console.error('[POST /api/study/generate-cards]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
