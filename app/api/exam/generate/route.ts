import { NextRequest, NextResponse } from 'next/server';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';
import { callAI } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subjectSlug = body.subject_slug || 'ap-chemistry';

    const syllabus = OFFICIAL_AP_SYLLABI[subjectSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];

    // Batched AI requests: 5 parallel requests x 10 questions = 50 total questions
    const chunksCount = 5;
    const chunkPromises = [];

    for (let i = 0; i < chunksCount; i++) {
      const startUnitIdx = (i * Math.ceil(syllabus.units.length / chunksCount)) % syllabus.units.length;
      const targetUnits = syllabus.units.slice(startUnitIdx, startUnitIdx + 2);

      const chunkPrompt = `You are a Principal College Board AP Exam Item Writer for ${syllabus.name}.
Generate 10 distinct, authentic, high-rigor College Board AP multiple-choice exam questions focusing on:
${targetUnits.map((u) => `- Unit ${u.unitNumber}: ${u.unitName} (${u.topics.join(', ')})`).join('\n')}

STRICT QUALITY REQUIREMENTS:
1. Every single question MUST be a REAL, highly realistic, contextual AP exam question featuring actual chemical formulas, stoichiometric math, calculus limits/derivatives/integrals, historical primary sources, biological pathways/phenotypes, or authentic passage excerpts.
2. ABSOLUTELY NO generic or repetitive placeholder questions.
3. Provide 4 realistic, distinct options per question [Option A, Option B, Option C, Option D].
4. Distribute the correct answer index evenly across 0 (A), 1 (B), 2 (C), and 3 (D).
5. Provide a detailed, multi-sentence College Board AP rubric explanation explaining explicitly WHY the correct answer is right and WHY distractors are wrong.
6. Return ONLY a valid JSON array of 10 objects with keys: "id", "unit", "topic", "question", "options", "correct", "explanation". Do NOT wrap in markdown code blocks.`;

      chunkPromises.push(
        callAI({
          route: 'exam_generation',
          messages: [{ role: 'user', content: chunkPrompt }],
        })
          .then((res) => {
            const jsonMatch = res.content.match(/\[[\s\S]*\]/);
            const cleanJson = jsonMatch ? jsonMatch[0] : res.content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return Array.isArray(parsed) ? parsed : [];
          })
          .catch((err) => {
            console.warn(`[Exam Generator Chunk ${i + 1}] AI call notice:`, err);
            return [];
          })
      );
    }

    const chunkResults = await Promise.all(chunkPromises);
    const aiQuestions: any[] = chunkResults.flat();

    const uniqueQuestionsMap = new Map<string, any>();

    // 1. Add AI generated questions
    aiQuestions.forEach((q) => {
      if (q && q.question && !uniqueQuestionsMap.has(q.question.trim())) {
        uniqueQuestionsMap.set(q.question.trim(), q);
      }
    });

    // 2. Add authentic curated seed questions from syllabus
    const seedQuestions = syllabus.questions || [];
    seedQuestions.forEach((q) => {
      if (q && q.question && !uniqueQuestionsMap.has(q.question.trim())) {
        uniqueQuestionsMap.set(q.question.trim(), q);
      }
    });

    const finalQuestionsList = Array.from(uniqueQuestionsMap.values()).slice(0, 50);

    const formatted = finalQuestionsList.map((q: any, idx: number) => ({
      id: q.id || `ai-${subjectSlug}-q${idx + 1}`,
      number: idx + 1,
      unit: q.unit || 'Core Unit',
      topic: q.topic || 'AP Concept',
      question: q.question,
      options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: typeof q.correct === 'number' ? q.correct : idx % 4,
      explanation: q.explanation || 'Official College Board AP Rubric Explanation.',
    }));

    return NextResponse.json({ questions: formatted });
  } catch (err) {
    console.error('[POST /api/exam/generate]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
