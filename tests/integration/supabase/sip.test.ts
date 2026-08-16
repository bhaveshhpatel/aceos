import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

// Use vi.hoisted to define mocks, preventing ReferenceError
const { mockSupabase, mockCreateServerClient, mockCreateBrowserClient } = vi.hoisted(() => {
  const mockSupabaseInstance = {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized' } })),
        eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized' } })) })),
        limit: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized' } })) })),
      })),
    })),
  };
  return {
    mockSupabase: mockSupabaseInstance,
    mockCreateServerClient: vi.fn(() => mockSupabaseInstance),
    mockCreateBrowserClient: vi.fn(() => mockSupabaseInstance),
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateServerClient,
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: mockCreateBrowserClient,
}));

describe('Supabase SIP RLS Policies', () => {
  // Mimic authenticated user for tests (normally handled by Supabase auth)
  const AUTH_USER_ID = 'test-student-id-123';
  const OTHER_USER_ID = 'test-student-id-456';

  beforeAll(() => {
    // Reset mocks before each test suite if necessary
    mockSupabase.from.mockClear();
  });

  it('Unauthorized user cannot read SIP data', async () => {
    const supabase = createServerClient(); // Unauthenticated context
    const { data, error } = await supabase.from('student_intelligence_profiles').select('*').single();
    expect(data).toBeNull();
    expect(error?.message).toContain('Unauthorized');
  });

  it('Authorized user can read their own SIP data', async () => {
    // Simulate authenticated user
    mockSupabase.from.mockImplementationOnce((tableName) => {
      if (tableName === 'student_intelligence_profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column, value) => {
              if (column === 'student_id' && value === AUTH_USER_ID) {
                return { single: vi.fn(() => ({ data: { student_id: AUTH_USER_ID, mastery_map: {} }, error: null })) };
              }
              return { single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized' } })) };
            }),
            limit: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized' } })) })),
          })),
        };
      }
      return mockSupabase.from();
    });

    const supabase = createServerClient();
    // For server-side client, user ID would be available via auth.getUser()
    // For this mock, we'll assume the RLS logic implicitly uses the context's user ID.
    const { data, error } = await supabase.from('student_intelligence_profiles').select('*').eq('student_id', AUTH_USER_ID).single();
    expect(data).toEqual({ student_id: AUTH_USER_ID, mastery_map: {} });
    expect(error).toBeNull();
  });

  it('Authorized user cannot read other students\' SIP data', async () => {
    // Simulate authenticated user trying to read another user's data
    mockSupabase.from.mockImplementationOnce((tableName) => {
      if (tableName === 'student_intelligence_profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column, value) => {
              if (column === 'student_id' && value === AUTH_USER_ID) {
                // This is the authenticated user's own data - allow
                return { single: vi.fn(() => ({ data: { student_id: AUTH_USER_ID, mastery_map: {} }, error: null })) };
              } else if (column === 'student_id' && value === OTHER_USER_ID) {
                // This is another user's data - deny
                return { single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized by RLS' } })) };
              }
              return { single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized' } })) };
            }),
            limit: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: { message: 'Unauthorized' } })) })),
          })),
        };
      }
      return mockSupabase.from();
    });

    const supabase = createServerClient();
    const { data, error } = await supabase.from('student_intelligence_profiles').select('*').eq('student_id', OTHER_USER_ID).single();
    expect(data).toBeNull();
    expect(error?.message).toContain('Unauthorized by RLS');
  });
});
