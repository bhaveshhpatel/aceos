import { NextRequest, NextResponse } from 'next/server';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';
import { callAI } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subjectSlug = body.subject_slug || 'ap-chemistry';

    const syllabus = OFFICIAL_AP_SYLLABI[subjectSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];
    const seedCards = syllabus.flashcards || [];

    const prompt = `You are an expert AP tutor for ${syllabus.name}.
Generate 20 authentic, high-quality flashcards for high school AP students covering key concepts:
${syllabus.units.map((u) => `- Unit ${u.unitNumber}: ${u.unitName} (${u.topics.join(', ')})`).join('\n')}

REQUIREMENTS:
1. Return ONLY valid JSON as a JSON array of objects.
2. Each object must have keys: "id", "unit", "topic", "question", "answer", "explanation".
3. Do NOT include Markdown code blocks. Output raw JSON array only.`;

    let generatedCards: any[] = [];
    try {
      const aiRes = await callAI({
        route: 'study_plan_generation',
        messages: [{ role: 'user', content: prompt }],
      });

      const jsonMatch = aiRes.content.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : aiRes.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        generatedCards = parsed;
      }
    } catch (aiErr) {
      console.warn('[Card Generator AI Notice]:', aiErr);
    }

    const uniqueCardsMap = new Map<string, any>();

    // 1. Add AI cards
    generatedCards.forEach((c) => {
      if (c && c.question && !uniqueCardsMap.has(c.question.trim())) {
        uniqueCardsMap.set(c.question.trim(), c);
      }
    });

    // 2. Add seed cards from syllabus
    seedCards.forEach((fc) => {
      if (fc && fc.question && !uniqueCardsMap.has(fc.question.trim())) {
        uniqueCardsMap.set(fc.question.trim(), fc);
      }
    });

    const finalCardsList = Array.from(uniqueCardsMap.values()).slice(0, 50);

    const formatted = finalCardsList.map((c: any, idx: number) => ({
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
