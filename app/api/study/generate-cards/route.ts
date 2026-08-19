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
      generatedCards = JSON.parse(cleanJson);
    } catch (aiErr) {
      console.warn('[Card Generator AI Fallback] Using syllabus seed bank:', aiErr);
    }

    if (!Array.isArray(generatedCards) || generatedCards.length < 4) {
      const fallbackCards: any[] = [];
      let cCount = 1;

      if (syllabus.flashcards && syllabus.flashcards.length > 0) {
        syllabus.flashcards.forEach((fc) => {
          fallbackCards.push({
            id: fc.id,
            unit: fc.unit,
            topic: fc.topic,
            question: fc.question,
            answer: fc.answer,
            explanation: fc.explanation,
          });
        });
        cCount = fallbackCards.length + 1;
      }

      syllabus.units.forEach((unit) => {
        unit.topics.forEach((topic) => {
          if (fallbackCards.length < 8) {
            fallbackCards.push({
              id: `ai-fc-${subjectSlug}-${cCount}`,
              unit: `Unit ${unit.unitNumber}: ${unit.unitName}`,
              topic,
              question: `[${syllabus.name}] What is the key concept, formula, or historical significance of ${topic}?`,
              answer: `${topic} is a high-frequency AP concept in ${syllabus.name} (Unit ${unit.unitNumber}). Master its definition and problem-solving steps.`,
              explanation: `[College Board AP Rubric] ${topic} accounts for a major portion of Unit ${unit.unitNumber} (${unit.weightPercentage} of AP exam). Focus on clear definitions and quantitative justifications.`,
            });
            cCount++;
          }
        });
      });

      generatedCards = fallbackCards;
    }

    return NextResponse.json({ cards: generatedCards });
  } catch (err) {
    console.error('[POST /api/study/generate-cards]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
