# AceOS — Architecture Standards

> **Audience:** Any engineer or AI assistant writing code for AceOS.
> **Authority:** Principal Engineer / Software Architect.
> **Enforcement:** Automated via ESLint, TypeScript strict mode, and CI gates. Violations block merge.

---

## 1. Architectural Philosophy

AceOS is built on three architectural principles that override all other preferences:

### 1.1 Plugability Over Hardcoding
Every external dependency is accessed through an abstraction layer. No application code imports an SDK directly. All vendor-specific logic lives in `lib/providers/`. All routing decisions live in config files.

### 1.2 Fail-Safe Over Fail-Fast (For Student-Facing Features)
When AI or external services fail, the student is never blocked. The system degrades gracefully: shows a saved state, offers retry, and logs the failure. Only internal operations (migrations, seeding) use fail-fast.

### 1.3 Data Locality
The Student Intelligence Profile (SIP) is the source of truth. No module computes mastery, priority, or predicted scores independently. All reads and writes go through `lib/sip/`. This ensures consistency across modules when GradeGuard, StudySensei, and SmartPack launch.

---

## 2. Layer Architecture

```
┌─────────────────────────────────────────────┐
│              Presentation Layer              │
│   app/ (Next.js pages + API Route Handlers)  │
│   components/ (React UI components)          │
└──────────────────┬──────────────────────────┘
                   │ imports only from lib/
┌──────────────────▼──────────────────────────┐
│              Business Logic Layer            │
│   lib/sip/         — SIP read/write          │
│   lib/ai/          — AI gateway + prompts    │
│   lib/fsrs/        — Spaced repetition       │
│   lib/ace-rank/    — Priority algorithm      │
│   lib/db/          — Database access         │
│   lib/providers/   — Plugable abstractions   │
└──────────────────┬──────────────────────────┘
                   │ imports only from config/ and types/
┌──────────────────▼──────────────────────────┐
│           Infrastructure / Config Layer      │
│   config/model_map.json                      │
│   config/analytics.config.ts                 │
│   config/email.config.ts                     │
│   config/payments.config.ts                  │
│   config/flags.config.ts                     │
│   migrations/ (Supabase SQL)                 │
└─────────────────────────────────────────────┘
```

### Layer Rules (Enforced by ESLint)

| From | Can Import From | Cannot Import From |
|---|---|---|
| `app/` | `lib/`, `components/`, `types/`, `hooks/` | `app/` (other routes), `config/` directly |
| `components/` | `lib/`, `types/`, `hooks/`, `components/ui/` | `app/`, `config/` directly |
| `lib/` | `types/`, `config/` | `app/`, `components/` |
| `config/` | nothing (pure data/config) | `lib/`, `app/`, `components/` |
| `types/` | nothing | everything else |

---

## 3. Provider Abstraction Pattern

Every external service follows this pattern. No exceptions.

### Step 1: Define the Interface in `lib/providers/[service]/interface.ts`
```typescript
// lib/providers/analytics/interface.ts
export interface AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  page(name: string, properties?: Record<string, unknown>): void;
  reset(): void;
}
```

### Step 2: Implement Each Provider in `lib/providers/[service]/[vendor].ts`
```typescript
// lib/providers/analytics/posthog.ts
import posthog from 'posthog-js';
import { AnalyticsProvider } from './interface';

export const posthogProvider: AnalyticsProvider = {
  track: (event, properties) => posthog.capture(event, properties),
  identify: (userId, traits) => posthog.identify(userId, traits),
  page: (name, properties) => posthog.capture('$pageview', { page: name, ...properties }),
  reset: () => posthog.reset()
};
```

### Step 3: Config File Controls Which Provider Is Active
```typescript
// config/analytics.config.ts
import { posthogProvider } from '@/lib/providers/analytics/posthog';
import { nullProvider } from '@/lib/providers/analytics/null'; // for tests

const providers = {
  posthog: posthogProvider,
  null: nullProvider
} as const;

type ProviderKey = keyof typeof providers;

const activeProvider: ProviderKey =
  (process.env.ANALYTICS_PROVIDER as ProviderKey) ?? 'posthog';

export const analytics = providers[activeProvider];
```

### Step 4: Application Code Uses Only the Config Export
```typescript
// Correct ✓
import { analytics } from '@/config/analytics.config';
analytics.track('diagnostic_completed', { subject: 'AP Chemistry' });

// Wrong ✗ — never import vendor SDK directly in app code
import posthog from 'posthog-js';
posthog.capture('diagnostic_completed');
```

**Swapping PostHog for Mixpanel = add `mixpanel.ts` to providers, update `ANALYTICS_PROVIDER` env var. Zero application code changes.**

---

## 4. API Route Architecture

All API routes follow this exact structure. No deviation.

```typescript
// app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { validateRequest } from '@/lib/validation/[feature]';
import { handleAIError } from '@/lib/ai/errors';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { withAuth } from '@/lib/middleware/auth';

export const runtime = 'edge'; // or 'nodejs' if Modal.com calls needed

export async function POST(req: NextRequest) {
  // 1. Auth check (always first)
  const authResult = await withAuth(req);
  if (!authResult.ok) return authResult.response;
  const { user } = authResult;

  // 2. Rate limit check
  const rateLimitResult = await withRateLimit(req, { tier: 'authenticated' });
  if (!rateLimitResult.ok) return rateLimitResult.response;

  // 3. Input validation
  const body = await req.json().catch(() => null);
  const validation = validateRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // 4. Business logic (delegated to lib/)
  try {
    const result = await doBusinessLogic(user.id, validation.data);
    return NextResponse.json(result);
  } catch (error) {
    // 5. Structured error handling
    return handleAIError(error, { student_id: user.id });
  }
}
```

**Rules:**
- Auth check is always step 1. Never skip it.
- Business logic always lives in `lib/`, never inline in the route handler.
- Every route has an input validation step with a Zod schema.
- Every route has a structured catch block using `handleAIError` or equivalent.
- Route handlers are never longer than 40 lines. Extract logic to `lib/`.

---

## 5. Database Access Pattern

All database access goes through typed query helpers in `lib/db/`. Raw Supabase client calls are never scattered across the codebase.

```typescript
// lib/db/queries/students.ts
import { createServerClient } from '@/lib/db/server';
import { Student, StudentInsert } from '@/types/database';

export async function getStudentById(studentId: string): Promise<Student | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new DatabaseError('getStudentById', error);
  }
  
  return data;
}
```

**Rules:**
- One file per table in `lib/db/queries/`.
- All query functions are typed with generated Supabase types.
- Raw `.from()` calls never appear in `app/` or `components/`.
- All errors are wrapped in `DatabaseError` with context.

---

## 6. State Management

- **Server state:** React Query (TanStack Query) for all data fetching. No manual `useEffect` + `fetch` patterns.
- **UI state:** `useState` / `useReducer` within components. No global UI state manager.
- **Auth state:** Supabase Auth listener + React Context (provided by `lib/providers/auth/`).
- **SIP state:** Server-side only. Never cached on the client longer than the session. Real-time updates via Supabase Realtime subscriptions where needed.

---

## 7. Performance Standards

| Metric | Target | Hard Limit |
|---|---|---|
| Time to First Byte (TTFB) | < 200ms | < 500ms |
| Largest Contentful Paint (LCP) | < 2.5s | < 4s |
| AI response (FRQ grading) | < 10s | < 15s |
| AI response (MCQ explanation) | < 3s | < 5s |
| Modal sandbox execution | < 1s warm | < 3s cold |
| Database query (indexed) | < 50ms | < 200ms |
| API route (non-AI) | < 300ms | < 800ms |

**If any hard limit is breached in production, it is treated as a P1 incident.**

---

## 8. Scalability Design Rules

1. **Stateless API routes.** No in-memory session state. Sessions live in Supabase.
2. **Edge-compatible by default.** API routes use `export const runtime = 'edge'` unless they require Node.js APIs (Modal.com calls require `nodejs`).
3. **Background jobs via Modal.com.** Any operation over 5 seconds (bulk grading, batch SIP updates) is offloaded to Modal.com as a background function, not run inline.
4. **Database connection pooling.** Supabase connection string always uses the pooler URL (`?pgbouncer=true`), not direct connection, from serverless functions.
5. **CDN-first assets.** All static assets (images, fonts) are served from Vercel's CDN. Never from the origin server.
6. **No N+1 queries.** Every list query that requires related data uses a single join query or Supabase `select('*, related_table(*)')`. Never fetch in a loop.

---

## 9. Observability

Every production incident must be diagnosable from logs alone. This requires:

- **Structured logging:** Every log line is JSON with `timestamp`, `level`, `service`, `trace_id`, `student_id` (hashed), and `message`.
- **Error tracking:** Sentry captures all unhandled exceptions with full context. Configured via `SENTRY_DSN` env var.
- **Performance monitoring:** Vercel Speed Insights + Sentry Performance for API route latency.
- **AI usage tracking:** Every AI call logged to `ai_usage_log` table (see Database Standards).
- **Health endpoint:** `GET /api/health` returns system status including DB connectivity, Modal sandbox ping, and AI gateway status.

---

*Last updated: April 2026 | AceOS Internal Standards*
