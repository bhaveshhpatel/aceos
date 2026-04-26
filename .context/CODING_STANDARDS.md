# AceOS — Coding Standards
## Principal Engineer Reference | All Contributors

> **Status:** Canonical. Every PR is reviewed against this document. No exceptions.

---

## 1. Non-Negotiable Rules

These are hard stops. A PR that violates any of these is rejected without further review.

1. **No `any` in TypeScript.** Ever. Use `unknown` and narrow, or define the type.
2. **No hardcoded secrets, API keys, model names, or URLs in source code.** All live in environment variables or config files.
3. **No inline AI prompts outside `lib/ai/prompts/`.** Prompts are logic. They belong in the versioned prompt registry.
4. **No direct database queries outside `lib/db/`.** All DB access goes through typed repository functions.
5. **No raw `catch (e) { console.log(e) }` blocks.** Every catch must either re-throw a typed error, call `handleAIError`, or call `handleAPIError` as appropriate.
6. **No `// TODO` comments merged to `main`.** Open a GitHub issue instead. TODOs in `main` are invisible debt.
7. **No component > 300 lines.** Split it. If you can't, it's doing too many things.
8. **No function > 40 lines (excluding type definitions and JSDoc).** Split it.
9. **Every exported function must have a JSDoc comment.** No exceptions for public API surface.
10. **No `console.log` in production code paths.** Use the structured logger (`lib/logger`).

---

## 2. TypeScript Standards

### Strictness Configuration
```json
// tsconfig.json — these settings are locked and non-negotiable
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Definitions
- **All domain types live in `types/` at repo root.** Never define domain types inline in components.
- **Use `interface` for object shapes, `type` for unions and intersections.**
- **Use Zod for runtime validation at all API boundaries.** TypeScript types alone are compile-time only — they do not validate data coming from external sources (AI responses, user input, webhooks).
- **Never cast with `as` unless you own the data source and have validated it.** Casting external data is a bug waiting to happen.

```typescript
// ✅ CORRECT
const result = mySchema.safeParse(data);
if (!result.success) throw new ValidationError(result.error);
const typed = result.data; // typed is now safe

// ❌ WRONG
const typed = data as MyType; // this is not validation, it's a lie
```

### Naming Conventions
| Entity | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `frq-grader.ts` |
| React components | `PascalCase` | `FRQGrader.tsx` |
| Functions | `camelCase` | `gradeStudentResponse()` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |
| Types/Interfaces | `PascalCase` | `StudentProfile` |
| Zod schemas | `camelCase + Schema` suffix | `frqResponseSchema` |
| Enum values | `SCREAMING_SNAKE_CASE` | `GradeStatus.NOT_EARNED` |
| Test files | `*.test.ts` or `*.spec.ts` | `frq-grader.test.ts` |

### Imports
- Use path aliases (`@/lib/...`, `@/types/...`, `@/components/...`). No relative `../../../` chains.
- Import order (enforced by ESLint `import/order`):
  1. Node built-ins
  2. External packages
  3. Internal `@/` aliases — alphabetical within group
  4. Relative imports
- No barrel exports (`index.ts` re-exporting everything). They cause circular dependency problems and hurt tree-shaking.

---

## 3. React & Next.js Standards

### Component Architecture
```
components/
├── ui/           # Dumb, stateless, reusable primitives (Button, Input, Badge)
├── features/     # Feature-scoped smart components (FRQGrader, DiagnosticTimer)
├── layouts/      # Page layout wrappers
└── ai/           # AI-specific UX components (AIErrorState, AILoadingState, StreamingText)
```

### Server vs Client Components
- **Default to Server Components.** Add `'use client'` only when you need:
  - Browser APIs (`window`, `document`, `navigator`)
  - Event handlers (`onClick`, `onChange`)
  - React hooks (`useState`, `useEffect`, `useContext`)
  - Third-party client-only libraries
- **Never fetch data in Client Components.** Data fetching belongs in Server Components or Route Handlers.
- **Never put secrets or DB calls in Client Component files.** The bundle is public.

### State Management
- **Server state:** TanStack Query (React Query) for all async server data. No manual `useEffect` + `fetch` patterns.
- **UI state:** `useState` / `useReducer` for local component state.
- **Cross-route state:** URL search params for shareable state (e.g., selected subject, filter). Zustand only if URL params are insufficient.
- **No Redux.** Overkill for this codebase.

### Forms
- All forms use React Hook Form + Zod resolver. No uncontrolled inputs with manual validation.

```typescript
// ✅ Standard form pattern
const form = useForm<z.infer<typeof signUpSchema>>({
  resolver: zodResolver(signUpSchema),
  defaultValues: { email: '', password: '' }
});
```

### Error Boundaries
- Every route segment must have an `error.tsx` file.
- Every async data-fetching component must have a `loading.tsx` skeleton.
- AI result components must use `<AIErrorState>` for AI-specific errors — not generic error boundaries.

---

## 4. API Route Standards

### Route Handler Structure (every route follows this pattern)
```typescript
// app/api/[feature]/route.ts
export async function POST(req: NextRequest) {
  // 1. Auth check — always first
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // 2. Input validation — always Zod
  const body = await req.json().catch(() => null);
  const parsed = myRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 3. Business logic — in try/catch
  try {
    const result = await doTheWork(parsed.data, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleAPIError(error, { user_id: user.id, route: '/api/[feature]' });
  }
}
```

### Response Shape
All API responses follow this structure:
```typescript
// Success
{ data: T, meta?: { page?: number, total?: number } }

// Error
{ error: ErrorCode, message: string, details?: unknown, retryable?: boolean }
```

Never return different shapes from the same endpoint. The client must be able to discriminate success from error by checking whether `error` is present.

### HTTP Status Codes
| Situation | Code |
|---|---|
| Success | 200 |
| Created | 201 |
| Bad input (schema fail) | 400 |
| Unauthenticated | 401 |
| Authorized but not permitted | 403 |
| Not found | 404 |
| Rate limited | 429 |
| AI provider unavailable | 503 |
| Unexpected server error | 500 |

---

## 5. Logging Standards

### Structured Logger (`lib/logger.ts`)
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'aceos-api', env: process.env.NODE_ENV },
  redact: [
    'req.headers.authorization',
    'body.password',
    'body.token',
    '*.api_key',
    '*.secret'
  ]
});
```

### Log Levels
| Level | When to Use |
|---|---|
| `error` | Unhandled exceptions, data loss risks, security violations |
| `warn` | Degraded state (AI fallback triggered, retry exhausted) |
| `info` | Key business events (student completed diagnostic, FRQ graded) |
| `debug` | Development tracing — stripped in production |

### What to Always Log
- Request ID (attach to every request via middleware)
- Student ID (for every authenticated action — never log full student data)
- AI route + model used + latency_ms
- Error code + context (never raw stack traces to client)

### What to Never Log
- Full student essay text
- Authentication tokens or session cookies
- Raw API keys or secrets
- PII beyond student_id (no names, emails, grades in logs)

---

## 6. Code Review Checklist

Every PR reviewer checks these before approving:

### Correctness
- [ ] No `any` types
- [ ] All external data validated with Zod before use
- [ ] Auth check is first in every Route Handler
- [ ] Error paths return structured responses, not raw exceptions

### Architecture
- [ ] No direct DB calls outside `lib/db/`
- [ ] No inline prompts outside `lib/ai/prompts/`
- [ ] No hardcoded model names or API URLs
- [ ] New config-driven behavior uses appropriate config file, not code

### Testing
- [ ] New business logic has unit tests
- [ ] New API routes have integration tests covering auth, validation, and happy path
- [ ] New AI-calling code has mocked tests (no live AI calls in test suite)

### Performance
- [ ] No N+1 database queries in any loop
- [ ] Large data sets are paginated, not fetched in full
- [ ] Images use `next/image` with explicit `width`/`height`
- [ ] Client-side data fetching uses TanStack Query (no bare `useEffect` fetches)

### Security
- [ ] No secrets in code
- [ ] No student data in logs
- [ ] New Supabase tables have RLS policies defined
- [ ] User input is sanitized before storage or AI input

---

## 7. Git & PR Standards

### Branch Naming
```
feature/TS2-01-modal-sandbox
bugfix/TS1-04-rls-policy-missing
chore/update-dependencies
hotfix/prod-frq-grader-schema-fail
```

### Commit Messages (Conventional Commits)
```
feat(frq): add humanities grader with rubric heatmap
fix(auth): resolve parental consent email not sending on Safari
test(gateway): add retry logic unit tests
chore(deps): upgrade supabase-js to 2.43.0
refactor(db): extract student profile queries to repository pattern
docs(standards): add API response shape specification
```

### PR Size Limits
- **Target: < 400 lines changed** per PR.
- PRs > 800 lines must be broken up. Large PRs are not reviewed — they are returned.
- Exceptions: auto-generated migrations, lockfile updates.

### PR Title
Must reference the story ID: `[TS2-01] Modal.com Python sandbox deployment`

### Merge Strategy
- **Squash and merge** for feature branches. One clean commit per story on `main`.
- **Merge commit** only for release branches.
- Direct push to `main` is disabled. All changes go through PRs.

---

*AceOS Coding Standards | Version 1.0 | April 2026*
*Owned by: Lead Engineer | Review cycle: per major phase*
