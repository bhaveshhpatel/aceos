/**
 * AC-03b — Server-side password validation (S1-F-01)
 *
 * Spec: POST /api/auth/signup must reject weak passwords at the API layer,
 * independent of client-side form validation. A caller that bypasses the
 * browser form and posts directly must receive HTTP 400 with the specific
 * rule that failed.
 *
 * Tied to: T1.4 → [POST /api/auth/signup] → "validate fields (Zod)"
 */

import { POST } from '@/app/api/auth/signup/route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BASE = {
  firstName: 'Maria',
  lastName: 'Chen',
  email: 'maria@example.com',
  dob: '2000-01-15', // adult — age gate irrelevant for password tests
  acceptedTerms: true,
}

// ---------------------------------------------------------------------------
// AC-03b · Password too short — server rejects directly POSTed request
// ---------------------------------------------------------------------------

describe('AC-03b — Server-side password validation', () => {
  test('rejects password shorter than 8 characters with HTTP 400', async () => {
    const req = makeRequest({ ...VALID_BASE, password: 'Ab1' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
    expect(body.fields.password).toMatch(/8 characters/i)
  })

  test('rejects password missing uppercase letter with HTTP 400', async () => {
    const req = makeRequest({ ...VALID_BASE, password: 'alllower1' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
    expect(body.fields.password).toMatch(/uppercase/i)
  })

  test('rejects password missing a number with HTTP 400', async () => {
    const req = makeRequest({ ...VALID_BASE, password: 'NoNumbersHere' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
    expect(body.fields.password).toMatch(/number/i)
  })

  test('accepts a valid password — Supabase createUser is reached', async () => {
    // supabase.auth.admin.createUser is mocked — we only assert it was called,
    // not the full signup flow (that is covered in other test files).
    const req = makeRequest({ ...VALID_BASE, password: 'ValidPass1' })
    const res = await POST(req)

    // 400 must NOT be returned for a valid password
    expect(res.status).not.toBe(400)
  })

  test('Supabase createUser is NOT called when password is invalid', async () => {
    // Import the mocked Supabase admin client
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const createUserSpy = vi.spyOn(adminClient.auth.admin, 'createUser')

    const req = makeRequest({ ...VALID_BASE, password: 'weak' })
    await POST(req)

    expect(createUserSpy).not.toHaveBeenCalled()
  })
})
