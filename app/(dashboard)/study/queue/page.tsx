'use client';

import { useState, useEffect } from 'react';
import { calculateFSRS, FSRSCardState, FSRSGrade } from '@/lib/fsrs/fsrs';
import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';

import { OFFICIAL_AP_SYLLABI } from '@/config/ap_syllabi';

function generateSyllabusFlashcards() {
  const cards: Array<{ id: string; subject: string; unit: string; question: string; answer: string; initialState: any }> = [];
  let idCount = 1;

  Object.values(OFFICIAL_AP_SYLLABI).forEach((syllabus) => {
    syllabus.units.forEach((unit) => {
      unit.topics.forEach((topic) => {
        cards.push({
          id: `card-${idCount++}`,
          subject: syllabus.name,
          unit: `Unit ${unit.unitNumber}: ${unit.unitName}`,
          question: `[${syllabus.name}] What is the key concept or formula for ${topic}?`,
          answer: `${topic} is a core requirement in ${syllabus.name} (Unit ${unit.unitNumber}). Understand its definition, quantitative applications, and AP exam rubric expectations.`,
          initialState: { stability: 1, difficulty: 5, repetition: 0, lapses: 0, last_review: new Date().toISOString() },
        });
      });
    });
  });

  return cards;
}

const DUE_CARDS = generateSyllabusFlashcards();

export default function StudyQueuePage() {
  const [enrolledSubjects, setEnrolledSubjects] = useState<Array<{ name: string; slug: string }>>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('ap-chemistry');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Fetch student enrolled subjects or default to all catalog subjects
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch('/api/auth/subjects');
        if (res.ok) {
          const data = await res.json();
          if (data.subjects && data.subjects.length > 0) {
            setEnrolledSubjects(data.subjects);
            setSelectedSlug(data.subjects[0].slug);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch student enrolled subjects', err);
      }

      // Local storage fallback if API unavailable
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('student_selected_slugs');
        if (saved) {
          try {
            const slugs: string[] = JSON.parse(saved);
            const list = slugs.map((slug) => {
              const found = OFFICIAL_AP_SYLLABI[slug];
              return { name: found ? found.name : slug.toUpperCase(), slug };
            });
            setEnrolledSubjects(list);
            if (list.length > 0) setSelectedSlug(list[0].slug);
            return;
          } catch (e) {}
        }
      }

      // Default fallback list
      setEnrolledSubjects([
        { name: 'AP Chemistry', slug: 'ap-chemistry' },
        { name: 'AP Calculus AB', slug: 'ap-calculus-ab' },
        { name: 'AP US History', slug: 'ap-us-history' },
      ]);
    }
    fetchSubjects();
  }, []);

  // Generate deduplicated subject cards for the active subject
  useEffect(() => {
    const syllabus = OFFICIAL_AP_SYLLABI[selectedSlug] || OFFICIAL_AP_SYLLABI['ap-chemistry'];
    const seenIds = new Set<string>();

    if (typeof window !== 'undefined') {
      const reviewed = localStorage.getItem(`reviewed_cards_${selectedSlug}`);
      if (reviewed) {
        try {
          JSON.parse(reviewed).forEach((id: string) => seenIds.add(id));
        } catch (e) {}
      }
    }

    const generated: CardItem[] = [];
    let count = 1;

    syllabus.units.forEach((unit) => {
      unit.topics.forEach((topic) => {
        const cardId = `card-${selectedSlug}-${count}`;
        if (!seenIds.has(cardId)) {
          generated.push({
            id: cardId,
            subjectSlug: selectedSlug,
            subjectName: syllabus.name,
            unit: `Unit ${unit.unitNumber}: ${unit.unitName}`,
            topic,
            question: `[${syllabus.name}] What is the core principle or analytical model behind ${topic}?`,
            answer: `${topic} is a high-priority topic in ${syllabus.name} (Unit ${unit.unitNumber}, weight ${unit.weightPercentage}).`,
            explanation: `Official AP Rubric Focus: Master ${topic} definitions, solve quantitative problems, and justify reasoning using AP terminology.`,
            initialState: {
              stability: 1,
              difficulty: 5,
              repetition: 0,
              lapses: 0,
              last_review: new Date().toISOString(),
            },
          });
        }
        count++;
      });
    });

    setCards(generated);
    setCurrentIndex(0);
    setShowAnswer(false);
    setCompleted(generated.length === 0);
  }, [selectedSlug]);

  const card = cards[currentIndex];

  async function handleGrade(grade: FSRSGrade) {
    if (!card) return;

    const result = calculateFSRS(card.initialState, grade);

    // Save reviewed card ID to localStorage deduplication tracking
    if (typeof window !== 'undefined') {
      const reviewedKey = `reviewed_cards_${selectedSlug}`;
      const saved = localStorage.getItem(reviewedKey);
      const list = saved ? JSON.parse(saved) : [];
      list.push(card.id);
      localStorage.setItem(reviewedKey, JSON.stringify(list));
    }

    await fetch('/api/study/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: card.id,
        grade,
        next_state: result.nextState,
        interval_days: result.intervalDays,
      }),
    }).catch(console.error);

    setShowAnswer(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCompleted(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-lg space-y-6 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <div className="flex flex-col space-y-1 text-xs text-slate-500">
          <div className="flex justify-between">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{card.subject}</span>
            <span>Card {currentIndex + 1} of {DUE_CARDS.length}</span>
          </div>
          <span className="text-[11px] text-slate-400">{card.unit}</span>
        </div>

        <div className="min-h-[140px] space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.question}</p>

          <div className="flex items-center space-x-2">
            <label htmlFor="queue-subject" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Subject:
            </label>
            <select
              id="queue-subject"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              {enrolledSubjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {completed || !card ? (
          <div className="space-y-4 text-center py-8">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Queue Completed for {OFFICIAL_AP_SYLLABI[selectedSlug]?.name || selectedSlug.toUpperCase()}!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You have reviewed all available high-quality AP cards for this subject without repeats.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(`reviewed_cards_${selectedSlug}`);
                }
                setSelectedSlug(selectedSlug);
              }}
              className="rounded bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Reset Subject Review History
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{card.unit}</span>
              <span>
                Card {currentIndex + 1} of {cards.length}
              </span>
            </div>

            <div className="min-h-[160px] space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {card.topic}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {card.question}
                </p>
              </div>

              {showAnswer && (
                <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {card.answer}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                    {card.explanation}
                  </p>
                </div>
              )}
            </div>

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500"
              >
                Show Answer & AP Rubric Explanation
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleGrade('again')}
                  className="rounded-md bg-red-100 px-2 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
                >
                  Again
                </button>
                <button
                  onClick={() => handleGrade('hard')}
                  className="rounded-md bg-orange-100 px-2 py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleGrade('good')}
                  className="rounded-md bg-green-100 px-2 py-2.5 text-xs font-bold text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
                >
                  Good
                </button>
                <button
                  onClick={() => handleGrade('easy')}
                  className="rounded-md bg-blue-100 px-2 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300"
                >
                  Easy
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
