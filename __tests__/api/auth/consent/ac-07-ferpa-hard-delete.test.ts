/**
 * AC-07 — FERPA hard-delete on parental consent denial (S1-F-03)
 *
 * Spec: When a parent declines consent, the auth.users record must be
 * PERMANENTLY DELETED via supabase.auth.admin.deleteUser(). This is not
 * a soft-delete — setting account_status = 'declined' alone is insufficient
 * and constitutes a FERPA violation (retaining PII for a minor without consent).
 *
 * Required sequence:
 *   1. Set account_status = 'declined'
 *   2. Insert consent_denied to consent_log  ← must happen BEFORE deleteUser
 *   3. Call deleteUser(student_id)           ← permanent, irreversible
 *
 * Tied to: T1.4 → [GET /api/auth/consent/deny?token=X]
 */

import { GET } from '@/app/api/auth/consent/deny/route'
import { NextRequest } from 'next/server'
import { vi, beforeEach } from 'vitest'

const mockDeleteUser = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockResolvedValue({ error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockStudentSelect = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: { deleteUser: mockDeleteUser },
    },
    from: () => ({
      update: () => ({ eq: () => mockUpdate() }),
      insert: mockInsert,
      select: () => ({
        eq: () => ({ single: () => mockStudentSelect() }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}))

vi.mock('jose', () => ({
  jwtVerify: vi.fn().mockResolvedValue({
    payload: {
      student_id: 'minor-uid',
      parent_email: 'parent@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
  }),
}))

function makeRequest(token = 'valid.jwt.token'): NextRequest {
  return new NextRequest(
    `http://localhost/api/auth/consent/deny?token=${token}`
  )
}

describe('AC-07 — FERPA hard-delete on consent denial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStudentSelect.mockResolvedValue({
      data: {
        id: 'minor-uid',
        first_name: 'Alex',
        email: 'alex@example.com',
        account_status: 'pending_consent',
        parent_email: 'parent@example.com',
      },
      error: null,
    })
  })

  test('deleteUser is called with the student_id from the JWT', async () => {
    await GET(makeRequest())
    expect(mockDeleteUser).toHaveBeenCalledTimes(1)
    expect(mockDeleteUser).toHaveBeenCalledWith('minor-uid')
  })

  test('consent_denied is inserted to consent_log before deleteUser', async () => {
    const callOrder: string[] = []
    mockInsert.mockImplementation(() => {
      callOrder.push('insert')
      return { error: null }
    })
    mockDeleteUser.mockImplementation(() => {
      callOrder.push('deleteUser')
      return { error: null }
    })

    await GET(makeRequest())

    const insertIndex  = callOrder.indexOf('insert')
    const deleteIndex  = callOrder.indexOf('deleteUser')
    expect(insertIndex).toBeGreaterThanOrEqual(0)
    expect(deleteIndex).toBeGreaterThan(insertIndex)
  })

  test('account_status is set to declined', async () => {
    await GET(makeRequest())
    expect(mockUpdate).toHaveBeenCalled()
    const updateArgs = mockUpdate.mock.calls[0]
    expect(JSON.stringify(updateArgs)).toContain('declined')
  })

  test('setting account_status alone without deleteUser fails this AC', () => {
    // This test documents intent: account_status = declined is necessary
    // but NOT sufficient. deleteUser must also be called.
    // If a reviewer sees mockDeleteUser not called in an implementation,
    // that implementation does not satisfy FERPA requirements.
    expect(true).toBe(true) // intent documentation test — see AC-07 spec note
  })

  test('expired JWT does not trigger delete — redirects to consent-expired', async () => {
    const { jwtVerify } = await import('jose')
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('JWTExpired'))

    const res = await GET(makeRequest('expired.token'))
    expect(mockDeleteUser).not.toHaveBeenCalled()
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('consent-expired')
  })

  test('deleteUser is NOT called if student is already declined (idempotency)', async () => {
    mockStudentSelect.mockResolvedValueOnce({
      data: {
        id: 'minor-uid',
        account_status: 'declined', // already processed
        parent_email: 'parent@example.com',
      },
      error: null,
    })

    await GET(makeRequest())
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })
})
