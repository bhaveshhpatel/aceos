# Signup API Tests — S1-F-01 Coverage

This directory contains unit tests for `POST /api/auth/signup` covering the gap ACs identified during the Session 5 PSE × PPM deliberation on S1-F-01.

## File Map

| File | AC | Description |
|---|---|---|
| `ac-03b-server-side-password-validation.test.ts` | AC-03b | API-layer password strength enforcement, independent of client form |
| `ac-05bc-age-boundary.test.ts` | AC-05b, AC-05c | Exact 18-year boundary (today = 18 → adult; today = 17y364d → minor) |
| `ac-06-student-row-shape.test.ts` | AC-06 | Full student row shape: all columns including `account_status`, `onboarding_completed`, `parent_email` |
| `ac-07-atomic-rollback.test.ts` | AC-07 | Atomic rollback: `deleteUser` called if `students` insert fails; API returns 500; no raw DB error leaked |

## Test Approach

- **Test-forward:** These tests were written against the spec in T1.4 and T1.1 *before* the implementation was validated. They will fail until the implementation is correct.
- **Mocking strategy:** Supabase Admin client and Resend are mocked at the module level. No real network calls are made.
- **Time control:** AC-05b/c use `vi.setSystemTime()` to pin "today" so age boundary math is deterministic across environments and CI.
- **Isolation:** Each `describe` block resets captured inserts and mock call counts in `beforeEach`.

## Running

```bash
npx vitest run __tests__/api/auth/signup
```

## Deliberation Reference

See: `docs/phase-1/epic-1/Sprint_1_Functional_Stories.md` — S1-F-01 ACs
See: `docs/phase-1/epic-1/Sprint_1_Technical_Stories.md` — T1.4 state machine
