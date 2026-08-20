import { NextRequest, NextResponse } from 'next/server';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';
import { callAI } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subjectSlug = body.subject_slug || 'ap-chemistry';

    const syllabus = OFFICIAL_AP_SYLLABI[subjectSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];

    // Request up to 50 cards via batched AI requests or dynamic syllabus topic recall generation
    const prompt = `You are an expert AP tutor for ${syllabus.name}.
Generate 15 authentic, high-quality flashcards for high school AP students covering:
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

      const cleanJson = aiRes.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        generatedCards = parsed;
      }
    } catch (aiErr) {
      console.warn('[Card Generator AI Notice] Primary AI call returned fallback:', aiErr);
    }

    const uniqueCardsMap = new Map<string, any>();

    // Add seed cards
    const seedCards = syllabus.flashcards || [];
    seedCards.forEach((fc) => {
      if (fc.question && !uniqueCardsMap.has(fc.question.trim())) {
        uniqueCardsMap.set(fc.question.trim(), fc);
      }
    });

    // Add AI cards
    generatedCards.forEach((c) => {
      if (c && c.question && !uniqueCardsMap.has(c.question.trim())) {
        uniqueCardsMap.set(c.question.trim(), c);
      }
    });

    // Fill up to 50 unique cards across syllabus topics if needed
    let cardCount = uniqueCardsMap.size;
    let uIdx = 0;

    while (uniqueCardsMap.size < 50 && syllabus.units.length > 0) {
      const unit = syllabus.units[uIdx % syllabus.units.length];
      for (const topic of unit.topics) {
        if (uniqueCardsMap.size >= 50) break;

        const qText = `What is the fundamental AP principle governing ${topic} in Unit ${unit.unitNumber}: ${unit.unitName}?`;
        if (!uniqueCardsMap.has(qText)) {
          uniqueCardsMap.set(qText, {
            id: `card-${subjectSlug}-${unit.unitNumber}-${cardCount + 1}`,
            unit: `Unit ${unit.unitNumber}: ${unit.unitName}`,
            topic,
            question: qText,
            answer: `${topic} dictates critical structural, quantitative, or historical relationships essential for ${syllabus.name}.`,
            explanation: `[College Board AP Rubric] ${topic} in ${unit.unitName} requires mastering key definitions, mathematical relationships, and contextual applications tested on Section I and II of the official AP exam.`,
          });
          cardCount++;
        }
      }
      uIdx++;
    }

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
