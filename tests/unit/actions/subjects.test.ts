import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser, mockSelect, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'subjects') {
        return {
          select: vi.fn(() => ({
            in: mockSelect,
          })),
        };
      }
      if (table === 'student_subjects') {
        return {
          insert: mockInsert,
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
      }
      if (table === 'students') {
        return { update: mockUpdate };
      }
      return {};
    }),
  })),
}));

import { saveSubjectSelections } from '@/app/actions/subjects';

describe('saveSubjectSelections Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails if no subjects selected', async () => {
    const res = await saveSubjectSelections([]);
    expect(res.success).toBe(false);
    expect(res.error).toContain('select between 1 and 4');
  });

  it('fails if more than 4 subjects selected', async () => {
    const res = await saveSubjectSelections(['s1', 's2', 's3', 's4', 's5']);
    expect(res.success).toBe(false);
    expect(res.error).toContain('select between 1 and 4');
  });

  it('saves valid subjects successfully', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'student-123' } }, error: null });
    mockSelect.mockResolvedValueOnce({
      data: [
        { id: 'sub-1', product_id: 'prod-1', slug: 'ap-chemistry' },
        { id: 'sub-2', product_id: 'prod-1', slug: 'ap-calculus-ab' },
      ],
      error: null,
    });
    mockInsert.mockResolvedValueOnce({ error: null });

    const res = await saveSubjectSelections(['ap-chemistry', 'ap-calculus-ab']);

    expect(res.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { student_id: 'student-123', subject_id: 'sub-1', product_id: 'prod-1' },
      { student_id: 'student-123', subject_id: 'sub-2', product_id: 'prod-1' },
    ]);
  });
});
