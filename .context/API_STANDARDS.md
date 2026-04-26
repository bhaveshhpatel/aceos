# AceOS — API Standards
## Principal Engineer Reference | Next.js Route Handlers

> **Rule:** Every API route is a contract with the client. Contracts do not change without versioning.

---

## 1. API Design Principles

1. **Resources over actions.** `/api/frq-submissions` not `/api/submitFRQ`.
2. **Consistent response shape.** Every endpoint returns `{ data }` on success, `{ error, message }` on failure. Always.
3. **Auth-first.** Authentication check is always the first line of every Route Handler.
4. **Validate everything.** Every request body, every query param is Zod-validated before use.
5. **Idempotent where possible.** POST creates. PUT replaces entirely. PATCH updates fields. GET never mutates.
6. **No business logic in Route Handlers.** Route Handlers orchestrate — they call service functions. Business logic lives in `lib/services/`.

---

## 2. URL Structure

```
/api/
├── auth/
│   ├── signup/route.ts
│   ├── parental-consent/route.ts
│   └── session/route.ts
├── students/
│   ├── [id]/
│   │   ├── profile/route.ts
│   │   └── sip/route.ts          # Student Intelligence Profile
├── diagnostics/
│   ├── route.ts                   # POST: start diagnostic
│   └── [id]/
│       ├── route.ts               # GET: diagnostic detail
│       └── submit/route.ts        # POST: submit answers
├── frq-submissions/
│   ├── route.ts                   # POST: create submission
│   └── [id]/
│       ├── route.ts               # GET: submission detail
│       └── dispute/route.ts       # POST: dispute grade
├── validate-stem/route.ts         # POST: STEM answer validation
├── study-plan/route.ts            # GET: student's current study plan
└── practice-queue/route.ts        # GET: today's FSRS queue
```

### URL Rules
- Lowercase, hyphenated: `/frq-submissions` not `/frqSubmissions`
- Plural nouns for collections: `/students`, `/frq-submissions`
- IDs in path params: `/frq-submissions/[id]`, not query params
- Filters and pagination in query params: `?subject=AP+Chemistry&page=2`

---

## 3. Standard Response Envelope

### Success Response
```typescript
// Single resource
{
  data: {
    id: "uuid",
    ...
  }
}

// Collection
{
  data: [...],
  meta: {
    total: 150,
    page: 1,
    pageSize: 20,
    nextCursor: "2026-04-20T21:00:00Z" | null
  }
}
```

### Error Response
```typescript
{
  error: "INVALID_INPUT" | "UNAUTHORIZED" | "NOT_FOUND" | "PROVIDER_UNAVAILABLE" | ...,
  message: "Human-readable description for UI display",
  details?: {         // Optional: field-level validation errors
    fieldErrors: { email: ["Invalid email address"] }
  },
  retryable?: boolean // For AI/provider errors
}
```

### TypeScript Error Code Enum
```typescript
// types/api-errors.ts
export const API_ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Input
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELDS: 'MISSING_FIELDS',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // AI/Provider
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_UNAVAILABLE: 'VALIDATION_UNAVAILABLE',
  INVALID_AI_RESPONSE: 'INVALID_AI_RESPONSE',
  
  // Business
  PARENTAL_CONSENT_REQUIRED: 'PARENTAL_CONSENT_REQUIRED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBJECT_NOT_SUPPORTED: 'SUBJECT_NOT_SUPPORTED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

export type APIErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
```

---

## 4. Request Validation Pattern

All request schemas live in `lib/schemas/api/` and are co-owned by the route and the client.

```typescript
// lib/schemas/api/frq-submission.schema.ts
import { z } from 'zod';

export const createFRQSubmissionSchema = z.object({
  subject: z.enum(['AP US History', 'AP World History', 'AP English Language',
                   'AP English Literature', 'AP Chemistry', 'AP Biology',
                   'AP Calculus AB', 'AP Statistics']),
  frqType: z.enum(['DBQ', 'LEQ', 'SAQ', 'FRQ']),
  promptText: z.string().min(10).max(2000),
  responseText: z.string().min(50).max(10000),
  rubricId: z.string().uuid()
});

export type CreateFRQSubmissionInput = z.infer<typeof createFRQSubmissionSchema>;
```

### Validation in Route Handler
```typescript
// app/api/frq-submissions/route.ts
export async function POST(req: NextRequest) {
  // 1. Auth
  const { user } = await requireAuth(req);  // throws UNAUTHORIZED if no session
  
  // 2. Parse body defensively
  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return errorResponse('INVALID_INPUT', 'Request body must be valid JSON', 400);
  }
  
  // 3. Validate
  const parsed = createFRQSubmissionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse('INVALID_INPUT', 'Invalid request data', 400, {
      details: parsed.error.flatten()
    });
  }
  
  // 4. Business logic (in service layer)
  try {
    const submission = await FRQSubmissionService.create(parsed.data, user.id);
    return successResponse(submission, 201);
  } catch (error) {
    return handleAPIError(error, { user_id: user.id });
  }
}
```

### Response Helper Functions
```typescript
// lib/api/response-helpers.ts
export function successResponse<T>(data: T, status: number = 200, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta && { meta }) }, { status });
}

export function errorResponse(
  code: APIErrorCode,
  message: string,
  status: number,
  extras?: { details?: unknown; retryable?: boolean }
) {
  return NextResponse.json({ error: code, message, ...extras }, { status });
}
```

---

## 5. Authentication Helper

```typescript
// lib/api/require-auth.ts
import { createClient } from '@/lib/db/client';
import { errorResponse } from './response-helpers';
import type { User } from '@supabase/supabase-js';

/**
 * Extracts and validates the authenticated user from the request.
 * Throws an UNAUTHORIZED response if no valid session exists.
 */
export async function requireAuth(req: NextRequest): Promise<{ user: User }> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }
  
  return { user };
}

/**
 * Validates that the authenticated user has confirmed parental consent
 * if they are under 18. Throws PARENTAL_CONSENT_REQUIRED if not.
 */
export async function requireConsentIfMinor(userId: string): Promise<void> {
  const profile = await StudentProfileRepo.getById(userId);
  if (!profile) throw errorResponse('NOT_FOUND', 'Student profile not found', 404);
  
  if (profile.age < 18 && !profile.parentalConsentConfirmed) {
    throw errorResponse('PARENTAL_CONSENT_REQUIRED',
      'Parental consent is required before accessing this feature', 403);
  }
}
```

---

## 6. Rate Limiting

Rate limiting is applied at the middleware layer, not inside Route Handlers.

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'),  // 60 requests per minute
  analytics: true
});

// Stricter limits for AI-heavy endpoints
const aiRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),   // 10 AI calls per minute per user
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/frq-submissions') ||
      request.nextUrl.pathname.startsWith('/api/validate-stem')) {
    const { success, limit, remaining } = await aiRatelimit.limit(
      request.headers.get('x-user-id') ?? request.ip ?? 'anonymous'
    );
    if (!success) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests. Please slow down.', retryable: true },
        { status: 429, headers: { 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(remaining) } }
      );
    }
  }
}
```

---

## 7. API Versioning Strategy

Phase 1–2: No versioning needed. All clients are the same Next.js app.

Phase 4+ (when school/external API consumers exist):
- Version prefix: `/api/v1/`, `/api/v2/`
- Old versions maintained for 6 months after deprecation notice
- Breaking changes require a new version — never change an existing v1 response shape

---

## 8. Streaming Responses (AI)

For AI responses that benefit from streaming (wrong-answer explainers, tutor conversations):

```typescript
// app/api/explain/route.ts
export async function POST(req: NextRequest) {
  const { user } = await requireAuth(req);
  // ... validation ...

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Stream in background
  (async () => {
    try {
      const aiStream = await callAIStream({ route: 'wrong_answer_explainer', messages });
      for await (const chunk of aiStream) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (error) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'STREAM_ERROR' })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

*AceOS API Standards | Version 1.0 | April 2026*
*Owned by: Lead Engineer | Review cycle: per major phase*
