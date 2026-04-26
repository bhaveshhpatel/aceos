# OBSERVABILITY STANDARDS
## AceOS — Logging, Monitoring & Alerting Reference
### Version 1.0 | Principal Engineer Authority Document

---

## Philosophy

You cannot fix what you cannot see. Observability is not an afterthought — it is built into every route, every AI call, every database migration from day one. In a product where a broken FRQ grader means students fail their AP exam, silent failures are unacceptable.

**Three pillars, all required:**
1. **Logs** — structured, queryable, machine-readable
2. **Metrics** — quantitative, trended, alertable
3. **Traces** — request-level, cross-service correlation

---

## Logging Standards

### Log Structure
All logs are structured JSON. No unstructured `console.log('something happened')` in production code.

```typescript
// lib/monitoring/logger.ts
import { createLogger } from './createLogger';

export const logger = createLogger({
  service: 'aceos-api',
  environment: process.env.NODE_ENV,
  version: process.env.NEXT_PUBLIC_APP_VERSION
});

// Usage — always include context object
logger.info('frq_grading_completed', {
  student_id: user.id,         // anonymized in prod logs (hashed, not raw)
  subject: 'AP US History',
  frq_type: 'DBQ',
  score: result.total_score,
  max_score: result.max_score,
  latency_ms: elapsed,
  model_used: aiResponse.model_used
});

logger.error('modal_sandbox_unavailable', {
  error_code: 'VALIDATION_UNAVAILABLE',
  subject_type: request.subject_type,
  fallback_triggered: true,
  question_id: request.question_id
});
```

### Log Levels
| Level | When to Use |
|---|---|
| `error` | Unrecoverable failure — something broke and needs human attention |
| `warn` | Degraded state — system is working but something is wrong (Modal fallback triggered, retry triggered) |
| `info` | Normal significant events — session started, FRQ graded, diagnostic completed |
| `debug` | Development only — verbose details, never in production |

### What to Log (Required)
- Every AI call: route, model, latency, token count, success/failure
- Every STEM sandbox call: subject, latency, result (correct/incorrect/unavailable)
- Every auth event: signup, login, logout, consent flow completion
- Every FRQ submission: subject, frq_type, score, latency (not the student's response text)
- Every error with code `error` level + full context
- Every retry: attempt number, reason, delay

### What NOT to Log
- Student response text or essay content
- Student names, email addresses, school names
- API keys or tokens (ever)
- Session tokens or auth cookies
- Full request/response bodies for AI calls (log metadata only)

### Student ID Handling in Logs
Student IDs are hashed before logging to prevent PII exposure in log systems:
```typescript
import { createHash } from 'crypto';

function hashForLog(id: string): string {
  return createHash('sha256').update(id + process.env.LOG_HASH_SALT).digest('hex').slice(0, 16);
}

// Use in logs:
logger.info('session_completed', {
  student_id_hash: hashForLog(user.id),  // NOT user.id directly
  subject: 'AP Chemistry',
  // ...
});
```

---

## Metrics & KPI Tables

### Required Supabase Metric Tables

#### `api_performance_log`
```sql
CREATE TABLE api_performance_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  route         TEXT NOT NULL,
  method        TEXT NOT NULL,  -- GET, POST, etc.
  status_code   INT NOT NULL,
  duration_ms   INT NOT NULL,
  student_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_code    TEXT
);
CREATE INDEX idx_perf_route_created ON api_performance_log (route, created_at DESC);
CREATE INDEX idx_perf_status ON api_performance_log (status_code, created_at DESC);
```

#### `ai_quality_log`
```sql
CREATE TABLE ai_quality_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  route                 TEXT NOT NULL,
  model                 TEXT NOT NULL,
  prompt_key            TEXT NOT NULL,
  prompt_version        TEXT NOT NULL,
  response_valid        BOOLEAN NOT NULL,
  schema_validation_error TEXT,
  latency_ms            INT NOT NULL,
  prompt_tokens         INT,
  completion_tokens     INT,
  subject               TEXT,
  frq_type              TEXT
);
```

#### `stem_validation_log`
```sql
CREATE TABLE stem_validation_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  subject_type      TEXT NOT NULL,
  answer_type       TEXT NOT NULL,
  sandbox_available BOOLEAN NOT NULL,
  result_correct    BOOLEAN,  -- null if sandbox unavailable
  latency_ms        INT NOT NULL,
  error_code        TEXT
);
```

#### `error_log`
```sql
CREATE TABLE error_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_code    TEXT NOT NULL,
  route         TEXT,
  provider      TEXT,
  message       TEXT NOT NULL,  -- sanitized, no PII
  student_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved      BOOLEAN DEFAULT false,
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX idx_error_code_created ON error_log (error_code, created_at DESC);
CREATE INDEX idx_error_unresolved ON error_log (resolved, created_at DESC) WHERE resolved = false;
```

---

## Alerting Thresholds

### Error Rate Alerts
| Metric | Warning | Critical | Action |
|---|---|---|---|
| API error rate (5xx) | > 1% in 5min | > 5% in 5min | Page on-call |
| AI gateway failure rate | > 5% in 10min | > 20% in 10min | Check provider status |
| Modal sandbox failure rate | > 10% in 10min | > 50% in 10min | Verify fallback is working |
| Auth failure rate | > 5% in 5min | > 20% in 5min | Check Supabase status |
| Schema validation failures | > 2% of AI calls | > 10% of AI calls | Review prompt changes |

### Latency Alerts
| Route | Warning | Critical |
|---|---|---|
| FRQ grading | p95 > 10s | p95 > 15s |
| Dashboard load | p95 > 500ms | p95 > 1s |
| STEM validation | p95 > 3s | p95 > 5s |

### Business Metric Alerts
| Metric | Alert Condition |
|---|---|
| Zero FRQ submissions in 1hr (during business hours) | May indicate pipeline failure |
| Zero diagnostic completions in 2hrs (during AP season) | Investigate immediately |
| SME agreement rate drop | < 75% in any subject in 1 week |

---

## Health Check Endpoints

Every deployable service must expose a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkAIGateway(),
    checkModalSandbox()
  ]);

  const health = {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled' ? 'ok' : 'error',
      ai_gateway: checks[1].status === 'fulfilled' ? 'ok' : 'error',
      modal_sandbox: checks[2].status === 'fulfilled' ? 'ok' : 'degraded'  // degraded, not error
    }
  };

  const statusCode = health.status === 'healthy' ? 200 : 207;  // 207 = partial success
  return NextResponse.json(health, { status: statusCode });
}

async function checkDatabase(): Promise<void> {
  const { error } = await supabase.from('health_check').select('id').limit(1);
  if (error) throw new Error('Database unreachable');
}
```

**Health check contract:**
- Returns 200 if all systems healthy
- Returns 207 if degraded but serving (Modal down, fallback active)
- Returns 503 if core systems (DB, Auth) are down
- Response time < 500ms always (health check itself has a 400ms timeout per check)
- Never cached

---

## Uptime & Availability Targets

| Component | Availability Target | Measurement |
|---|---|---|
| Frontend (Vercel) | 99.9% | Vercel status + external ping |
| API routes | 99.5% | Health check + error rate |
| Database (Supabase) | 99.9% | Supabase status page |
| AI grading pipeline | 99.0% | FRQ grading success rate |
| STEM sandbox (Modal) | 98.0% | Sandbox call success rate |

**Fallback behavior when availability target is missed:**
- Database down → Maintenance page served immediately
- AI gateway down → Student sees `PROVIDER_UNAVAILABLE` error, work is saved
- Modal sandbox down → Validation returns `correct: null`, student is not blocked
- Grading queue → If AI is down, FRQ submissions are queued for async processing when AI recovers

---

## Runbook: Common Failures

### FRQ Grading Returning INVALID_RESPONSE > 5%
1. Check `ai_quality_log` for prompt_key and prompt_version of failing calls
2. Test affected prompt manually with representative inputs
3. If prompt is the issue: roll back prompt version in registry.ts
4. If model behavior changed: open issue, consider route change in model_map.json
5. Notify students whose submissions failed with retry option

### Modal Sandbox Failure Rate > 50%
1. Check Modal.com status page
2. Confirm fallback is active: STEM answers should return `correct: null`, not 500
3. If Modal is down > 30 minutes: post status to student-facing status page
4. When Modal recovers: no action needed — fallback auto-resolves

### Supabase RLS Blocking Legitimate Writes
1. Check `error_log` for `42501` (Postgres RLS violation) errors
2. Identify which table and which policy is blocking
3. Reproduce in Supabase Table Editor with affected user role
4. Fix policy in a new migration — never disable RLS to resolve

---

*AceOS — Observability Standards v1.0 | April 2026*
