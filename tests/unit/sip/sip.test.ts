/**
 * UNIT TESTS — lib/sip/index.ts: getSIP
 *
 * Strategy: mock Supabase client to test SIP assembly logic in isolation.
 * We verify product scoping, mastery_map aggregation, and null handling.
 */

import { describe, it, expect, vi } from 'vitest';
import { getSIP } from '@/lib/sip/index';

// ── Supabase mock ─────────────────────────────────────────────────────────────
function makeMockSupabase(studentData: any, error: any = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: studentData, error }),
        }),
      }),
    }),
  } as any;
}

describe('getSIP', () => {
  it('returns null when student is not found', async () => {
    const supabase = makeMockSupabase(null, { message: 'not found' });
    const result = await getSIP(supabase, 'non-existent-id');
    expect(result).toBeNull();
  });

  it('returns a valid SIP object for a found student', async () => {
    const studentData = {
      id: 'student-1',
      student_subjects: [
        { subject: { name: 'AP Calculus BC', slug: 'ap-calc-bc', product: { slug: 'score-boost-ap' } } },
      ],
      mastery_map: [
        {
          subject_id:      'ap-calc-bc',
          unit_slug:       'limits',
          mastery_score:   0.75,
          last_reviewed_at: '2026-04-01',
          fsrs_due_at:     '2026-05-01',
          product:         { slug: 'score-boost-ap' },
        },
      ],
    };
    const supabase = makeMockSupabase(studentData);
    const sip = await getSIP(supabase, 'student-1', 'score-boost-ap');

    expect(sip).not.toBeNull();
    expect(sip!.student_id).toBe('student-1');
    expect(sip!.product_id).toBe('score-boost-ap');
    expect(sip!.ap_subjects).toContain('AP Calculus BC');
    expect(sip!.mastery_map['ap-calc-bc']['limits'].mastery).toBe(0.75);
  });

  it('filters out subjects from other products', async () => {
    const studentData = {
      id: 'student-1',
      student_subjects: [
        { subject: { name: 'AP Calc BC',  slug: 'ap-calc-bc',  product: { slug: 'score-boost-ap' } } },
        { subject: { name: 'GradeGuard',  slug: 'gg-subject',  product: { slug: 'grade-guard' } } },
      ],
      mastery_map: [],
    };
    const supabase = makeMockSupabase(studentData);
    const sip = await getSIP(supabase, 'student-1', 'score-boost-ap');

    expect(sip!.ap_subjects).toHaveLength(1);
    expect(sip!.ap_subjects[0]).toBe('AP Calc BC');
  });

  it('returns empty mastery_map when student has no mastery rows yet', async () => {
    const studentData = {
      id: 'student-1',
      student_subjects: [],
      mastery_map: [],
    };
    const supabase = makeMockSupabase(studentData);
    const sip = await getSIP(supabase, 'student-1', 'score-boost-ap');

    expect(sip!.mastery_map).toEqual({});
    expect(sip!.ap_subjects).toEqual([]);
  });

  it('defaults productSlug to score-boost-ap when not provided', async () => {
    const studentData = { id: 'student-1', student_subjects: [], mastery_map: [] };
    const supabase = makeMockSupabase(studentData);
    const sip = await getSIP(supabase, 'student-1'); // no productSlug arg
    expect(sip!.product_id).toBe('score-boost-ap');
  });
});
