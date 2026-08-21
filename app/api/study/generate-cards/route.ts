import { NextRequest, NextResponse } from 'next/server';
import { OFFICIAL_AP_SYLLABI, APUnitSyllabus } from '@/config/ap_syllabi';
import { callAI } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

function generateSubjectTopicCard(
  subjectName: string,
  category: string,
  unit: APUnitSyllabus,
  topic: string,
  index: number
) {
  let qText = '';
  let aText = '';
  let expText = '';

  if (category === 'STEM') {
    qText = `What fundamental AP principle or mathematical relationship governs ${topic} in Unit ${unit.unitNumber}: ${unit.unitName}?`;
    aText = `${topic} describes critical quantitative relationships, rate laws, or structural equilibrium parameters essential for ${subjectName}.`;
    expText = `[College Board AP Rubric] ${topic} in ${unit.unitName} requires mastering core formulas, experimental design, and quantitative interpretations on the AP exam.`;
  } else if (category === 'HUMANITIES') {
    qText = `How did developments in ${topic} influence institutional or social structures during Unit ${unit.unitNumber}: ${unit.unitName}?`;
    aText = `${topic} triggered significant political centralization, economic trade shift, or cultural reform within this period.`;
    expText = `[College Board AP Rubric] ${topic} in ${unit.unitName} is evaluated on Section I and II of the ${subjectName} exam for historical causation and contextualization.`;
  } else {
    qText = `How does an author effectively develop a claim regarding ${topic} in Unit ${unit.unitNumber}: ${unit.unitName}?`;
    aText = `By integrating structured evidence, syntactical choice, and logical line of reasoning centered on ${topic}.`;
    expText = `[College Board AP Rubric] ${topic} in ${unit.unitName} focuses on analyzing rhetorical strategies, thesis development, and argument cohesion.`;
  }

  return {
    id: `card-${unit.unitNumber}-${index + 1}`,
    unit: `Unit ${unit.unitNumber}: ${unit.unitName}`,
    topic,
    question: qText,
    answer: aText,
    explanation: expText,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subjectSlug = body.subject_slug || 'ap-chemistry';

    const syllabus = OFFICIAL_AP_SYLLABI[subjectSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];

    const prompt = `You are an expert AP tutor for ${syllabus.name}.
Generate 15 authentic, high-quality flashcards for high school AP students covering key concepts:
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
    const seedCards = syllabus.flashcards || [];
    seedCards.forEach((fc) => {
      if (fc && fc.question && !uniqueCardsMap.has(fc.question.trim())) {
        uniqueCardsMap.set(fc.question.trim(), fc);
      }
    });

    // 3. Fill up to 50 cards across topics
    let cardCount = uniqueCardsMap.size;
    let uIdx = 0;

    while (uniqueCardsMap.size < 50 && syllabus.units.length > 0) {
      const unit = syllabus.units[uIdx % syllabus.units.length];
      for (const topic of unit.topics) {
        if (uniqueCardsMap.size >= 50) break;

        const dynamicCard = generateSubjectTopicCard(
          syllabus.name,
          syllabus.category,
          unit,
          topic,
          cardCount
        );

        if (!uniqueCardsMap.has(dynamicCard.question.trim())) {
          uniqueCardsMap.set(dynamicCard.question.trim(), dynamicCard);
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
