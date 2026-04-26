# SECURITY STANDARDS
## AceOS — Production Security Reference
### Version 1.0 | Principal Engineer Authority Document

---

## Non-Negotiable Rules

These are hard rules. Any code that violates them does not merge, period.

1. **No secrets in code.** No API keys, tokens, passwords, or connection strings in any TypeScript, Python, JSON, or config file committed to the repo. All secrets live in environment variables. `.env.local` is gitignored. `.env.example` shows keys with empty values only.
2. **No raw errors to clients.** Internal stack traces, database errors, AI provider error details, and system paths never appear in HTTP responses. Every error boundary returns a structured, sanitized error object.
3. **No unauthenticated writes.** Every database mutation route checks `supabase.auth.getUser()` before touching data. There are no exceptions for "internal" routes.
4. **No client-side secrets.** Nothing in `NEXT_PUBLIC_*` env vars except Supabase URL and anon key. All AI keys, Modal keys, and service keys are server-only.
5. **RLS on every table.** Every Supabase table has Row Level Security enabled and at least one policy. A table with RLS enabled but zero policies blocks all access by default — this is correct behavior until policies are written.

---

## Authentication Standards

### Session Handling
```typescript
// CORRECT — always use getUser() not getSession() for auth checks
const { data: { user }, error } = await supabase.auth.getUser();
if (!user || error) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// WRONG — getSession() trusts client-provided JWT, not server-verified
const { data: { session } } = await supabase.auth.getSession(); // Never use for auth checks
```

### Auth in API Routes
Every API route that reads or writes user data must follow this exact pattern:
```typescript
export async function POST(req: NextRequest) {
  // Step 1: Auth check — always first, before any other logic
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 2: Input validation — before any DB or AI call
  const body = await req.json();
  const parsed = myRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Step 3: Authorization — does this user own this resource?
  // RLS handles this at DB level, but explicit checks add defense-in-depth
  if (parsed.data.student_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Step 4: Business logic
  // ...
}
```

### Age Gate & Parental Consent
- Students under 18 must complete parental consent before accessing any data-storing feature
- Age gate is enforced at the database level via a `parental_consent_verified` boolean on the student profile
- RLS policy on `student_profiles` blocks reads/writes if `parental_consent_verified = false` for students where `date_of_birth` is < 18 years ago
- Parental consent email uses a signed token with 72-hour expiry

---

## Input Validation Standards

### All inputs validated with Zod before use
```typescript
// Every API route input is validated before touching DB or AI
import { z } from 'zod';

const submitFrqSchema = z.object({
  subject: z.enum(['AP Chemistry', 'AP Biology', 'AP US History', 'AP World History', 'AP English Language', 'AP Calculus AB']),
  frq_type: z.enum(['DBQ', 'LEQ', 'SAQ', 'FRQ']),
  prompt_id: z.string().uuid(),
  response_text: z.string().min(10).max(10000),  // hard max prevents prompt injection via oversized input
});
```

### Prompt Injection Defense
- Student-submitted text is never interpolated directly into AI system prompts
- Student input always goes into the `user` role message only
- System prompts are static, versioned templates (see `TESTING_STANDARDS.md` prompt system)
- Maximum input length enforced at Zod validation layer before AI call:
  - FRQ responses: 10,000 chars max
  - MCQ answers: 500 chars max
  - Diagnostic inputs: 2,000 chars max

### SQL Injection Defense
- Supabase client uses parameterized queries exclusively
- Raw SQL only in migration files — never in application code
- If raw SQL is ever needed in app code, use `supabase.rpc()` with typed parameters, never string concatenation

---

## Data Encryption Standards

### At Rest
- All Supabase tables use AES-256 encryption at rest (Supabase default, verify in project settings)
- Sensitive fields (student grade data, mastery scores, study patterns) have no additional application-layer encryption in Phase 1 — Supabase-level is sufficient
- If Phase 4 adds school district data under a DPA, field-level encryption is required for PII fields

### In Transit
- All traffic is HTTPS. No HTTP endpoints. Vercel enforces this by default.
- Supabase connection string uses SSL mode `require` — never `disable` or `prefer`
- Modal.com webhook calls use Bearer token auth over HTTPS

---

## FERPA Compliance Rules

### What counts as an education record in AceOS
- Mastery scores, SIP data, diagnostic results, FRQ submissions and scores
- Study session history, practice question answers
- Predicted AP scores
- GPA data (Phase 2)

### Rules for education records
1. Education records are stored only in Supabase — never in AI provider logs, never in third-party analytics tools
2. AI providers (OpenAI, Groq) receive question content and student responses but **never** receive student names, email addresses, school names, or any PII alongside the educational content. The only identifier passed to AI providers is an opaque `session_id` for correlation if needed.
3. Parental consent flow is required before any education record is written for students under 18
4. Students can request deletion of their data — delete cascade is configured on all student-linked tables
5. Aggregated analytics are anonymized before storage in any analytics table — individual student records are never used in aggregate views without anonymization

### Data Minimization
- Collect only what is needed for the feature
- Do not log full student responses to application logs — log only `response_id` and `subject`
- AI usage logs store only token counts and latency — not the actual prompt content

---

## Dependency Security

### Rules
- `npm audit` must pass with zero high or critical vulnerabilities before any merge to `main`
- `npm audit` runs automatically in CI (see `CICD_STANDARDS.md`)
- Dependencies are pinned to exact versions in `package.json` (no `^` or `~` in production deps)
- `dependabot.yml` configured for weekly security updates with auto-PR

### Allowed Third-Party Services (data may flow to these)
| Service | Data Sent | Justification |
|---|---|---|
| OpenAI API | Question content + student response text (no PII) | FRQ grading, diagnostics |
| Groq API | Question content + student response text (no PII) | Fast inference |
| Modal.com | Mathematical expressions, code snippets (no PII) | STEM validation sandbox |
| Supabase | All student data (encrypted at rest) | Primary database + auth |
| Vercel | HTTP request metadata only | Frontend hosting |

### Prohibited
- No Google Analytics, Mixpanel, Amplitude, or any third-party analytics SDK that receives student behavioral data
- No Sentry or error monitoring tool that captures full request bodies (configure to scrub PII before enabling)
- No CDN or edge cache that stores authenticated response bodies

---

## Security Review Checklist (PR Gate)

Every PR that touches auth, database schema, or AI routing must be reviewed against:

- [ ] `getUser()` used (not `getSession()`) for all auth checks
- [ ] All new tables have RLS enabled + at least one policy
- [ ] All new API route inputs are Zod-validated
- [ ] No secrets, keys, or tokens committed
- [ ] No PII sent to AI providers alongside content
- [ ] No raw error details in API responses
- [ ] Student data deletion cascade tested if new tables reference `auth.users`
- [ ] `npm audit` passes in CI

---

*AceOS — Security Standards v1.0 | April 2026*
*This document is authoritative. Violations require immediate remediation before merge.*
