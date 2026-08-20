// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignJWT } from 'jose';

const {
  mockResendSend,
  mockStudentsSelect,
  mockStudentsUpdate,
  mockAuthEventInsert,
  mockGetUser,
  mockDeleteUser,
} = vi.hoisted(() => ({
  mockResendSend: vi.fn().mockResolvedValue({ error: null }),
  mockStudentsSelect: vi.fn(),
  mockStudentsUpdate: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  mockAuthEventInsert: vi.fn().mockResolvedValue({ error: null }),
  mockGetUser: vi.fn(),
  mockDeleteUser: vi.fn().mockResolvedValue({}),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'students') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockStudentsSelect,
            })),
          })),
          update: mockStudentsUpdate,
        };
      }
      if (table === 'auth_event_log') {
        return { insert: mockAuthEventInsert };
      }
      return {};
    }),
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

import { POST as sendPOST } from '@/app/api/auth/consent/send/route';
import { GET as approveGET } from '@/app/api/auth/consent/approve/route';
import { GET as denyGET } from '@/app/api/auth/consent/deny/route';

const SECRET_KEY = new Uint8Array(Buffer.from('default-secret-key-at-least-32-bytes-long!'));

describe('Parental Consent API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/consent/send', () => {
    it('returns 401 if unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('No session') });
      const req = new Request('http://localhost/api/auth/consent/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_email: 'parent@example.com' }),
      });
      const res = await sendPOST(req as any);
      expect(res.status).toBe(401);
    });

    it('returns 200 on valid parent email and pending account status', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'student-123', email: 'student@example.com' } }, error: null });
      mockStudentsSelect.mockResolvedValueOnce({
        data: { first_name: 'Alex', account_status: 'pending_age_check' },
        error: null,
      });

      const req = new Request('http://localhost/api/auth/consent/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_email: 'parent@example.com' }),
      });

      const res = await sendPOST(req as any);
      expect(res.status).toBe(200);
      expect(mockAuthEventInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'consent_email_sent',
          actor_email: 'parent@example.com',
        })
      );
      expect(mockResendSend).toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/consent/approve', () => {
    it('redirects to consent-expired on missing or invalid token', async () => {
      const req = new Request('http://localhost/api/auth/consent/approve?token=invalid');
      const res = await approveGET(req as any);
      expect(res.headers.get('location')).toContain('/auth/consent-expired');
    });

    it('approves consent and redirects to onboarding/subjects for valid token', async () => {
      const token = await new SignJWT({ student_id: 'student-123', parent_email: 'parent@example.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(SECRET_KEY);

      mockStudentsSelect.mockResolvedValueOnce({
        data: { id: 'student-123', email: 'student@example.com', first_name: 'Alex', account_status: 'pending_consent' },
        error: null,
      });

      const req = new Request(`http://localhost/api/auth/consent/approve?token=${token}`);
      const res = await approveGET(req as any);

      expect(res.headers.get('location')).toContain('/onboarding/subjects');
      expect(mockAuthEventInsert).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'consent_granted' })
      );
    });
  });

  describe('GET /api/auth/consent/deny', () => {
    it('denies consent, deletes auth user, and redirects on valid token', async () => {
      const token = await new SignJWT({ student_id: 'student-123', parent_email: 'parent@example.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(SECRET_KEY);

      mockStudentsSelect.mockResolvedValueOnce({
        data: { id: 'student-123', account_status: 'pending_consent' },
        error: null,
      });

      const req = new Request(`http://localhost/api/auth/consent/deny?token=${token}`);
      const res = await denyGET(req as any);

      expect(res.headers.get('location')).toContain('/auth/consent-already-actioned');
      expect(mockAuthEventInsert).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'consent_denied' })
      );
      expect(mockDeleteUser).toHaveBeenCalledWith('student-123');
    });
  });
});
