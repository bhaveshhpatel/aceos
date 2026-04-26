# PERFORMANCE STANDARDS
## AceOS — Production Performance Reference
### Version 1.0 | Principal Engineer Authority Document

---

## Performance Budgets (Hard Limits)

These are measured targets, not aspirations. CI fails if budgets are breached.

### API Response Times (p95, measured from client)
| Endpoint Type | p95 Target | Hard Limit (p99) |
|---|---|---|
| Auth (login, signup) | < 400ms | < 800ms |
| Dashboard load (SIP read) | < 300ms | < 600ms |
| Diagnostic question fetch | < 200ms | < 400ms |
| MCQ answer evaluation | < 500ms | < 1000ms |
| STEM validation (Modal sandbox) | < 2000ms | < 4000ms |
| FRQ grading (GPT-4o) | < 8000ms | < 15000ms |
| Study plan generation | < 3000ms | < 6000ms |
| Wrong-answer explainer (Groq) | < 1500ms | < 3000ms |

### Frontend Performance (Core Web Vitals — production)
| Metric | Target | Fail Threshold |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.0s | > 2.5s |
| FID / INP | < 100ms | > 200ms |
| CLS (Cumulative Layout Shift) | < 0.05 | > 0.1 |
| TTFB (Time to First Byte) | < 200ms | > 400ms |
| JS Bundle (initial, gzipped) | < 150KB | > 250KB |

### Database Query Times
| Query Type | p95 Target |
|---|---|
| Single row read (by primary key) | < 10ms |
| SIP full read (student dashboard) | < 30ms |
| FSRS queue computation (per student) | < 50ms |
| Aggregate analytics query | < 500ms |

---

## Caching Architecture

### Layer 1: Next.js Route Cache
```typescript
// Static data: cache aggressively
export async function GET() {
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' }
  });
}

// User-specific data: never cache at CDN layer
export async function GET() {
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, no-store' }
  });
}
```

### Layer 2: React Query (Client Cache)
```typescript
// Standard cache config per data type
export const CACHE_CONFIG = {
  sip: {
    staleTime: 30 * 1000,          // SIP: 30s stale (changes after sessions)
    gcTime: 5 * 60 * 1000,         // 5min garbage collect
  },
  diagnosticQuestions: {
    staleTime: 60 * 60 * 1000,     // 1hr — questions don't change
    gcTime: 24 * 60 * 60 * 1000,   // 24hr GC
  },
  studyQueue: {
    staleTime: 5 * 60 * 1000,      // 5min — queue updates after answers
    gcTime: 10 * 60 * 1000,
  },
  gradingResult: {
    staleTime: Infinity,            // Grading results never go stale
    gcTime: Infinity,
  },
} as const;
```

### Layer 3: Supabase Query Optimization
```typescript
// CORRECT: Select only columns needed
const { data } = await supabase
  .from('student_profiles')
  .select('id, ap_subjects, mastery_map, predicted_ap_scores')
  .eq('id', userId)
  .single();

// WRONG: Never select *
const { data } = await supabase
  .from('student_profiles')
  .select('*')   // Fetches all columns including unused ones
  .eq('id', userId);
```

---

## Database Performance Rules

### Required Indexes
Every new table migration must include:
1. Index on any foreign key column used in JOINs
2. Index on any column used in WHERE clauses in hot paths
3. Composite index if two columns are always queried together
4. Partial index if the WHERE clause filters by a boolean or enum

```sql
-- Template for new table migration
CREATE TABLE my_new_table (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  subject     TEXT NOT NULL,
  -- ... other columns
);

-- Always include these indexes:
CREATE INDEX idx_my_new_table_student_id ON my_new_table (student_id);
CREATE INDEX idx_my_new_table_created_at ON my_new_table (created_at DESC);
-- Add subject index if queried by subject
CREATE INDEX idx_my_new_table_student_subject ON my_new_table (student_id, subject);
```

### N+1 Query Prevention
```typescript
// WRONG: N+1 pattern
const students = await getStudents();
for (const student of students) {
  const sip = await getSIP(student.id);  // N queries
}

// CORRECT: Join or batch
const { data } = await supabase
  .from('student_profiles')
  .select(`
    id, name,
    sip:student_intelligence_profiles(mastery_map, predicted_ap_scores)
  `)
  .in('id', studentIds);  // Single query
```

### Connection Pooling
- Supabase connection string in application uses the **pooler URL** (port 6543), not the direct connection (port 5432)
- Direct connection is only for migration scripts and local dev
- Pool mode: Transaction (not Session) for serverless/edge environments

---

## Frontend Performance Rules

### Bundle Size Management
```typescript
// Dynamic imports for heavy components
const FRQEditor = dynamic(() => import('@/components/frq/FRQEditor'), {
  loading: () => <FRQEditorSkeleton />,
  ssr: false  // FRQ editor is client-only
});

const MasteryHeatmap = dynamic(() => import('@/components/charts/MasteryHeatmap'), {
  loading: () => <HeatmapSkeleton />
});

// Never import entire icon libraries
import { CheckCircle } from 'lucide-react';  // CORRECT: named import
import * as Icons from 'lucide-react';       // WRONG: imports everything
```

### Image Optimization
```typescript
// Always use next/image — never <img>
import Image from 'next/image';

// Always specify width/height or fill to prevent CLS
<Image src={avatarUrl} alt="Student avatar" width={40} height={40} />
```

### Loading States
Every data-fetching component must have a skeleton loading state. No raw spinners on content areas. No content without dimensions (causes CLS).

```typescript
// Every async component pattern:
function StudentDashboard() {
  const { data: sip, isLoading } = useSIP();
  
  if (isLoading) return <DashboardSkeleton />;  // Skeleton matches layout
  if (!sip) return <DashboardEmpty />;          // Empty state defined
  return <DashboardContent sip={sip} />;
}
```

---

## AI Pipeline Performance Rules

### Streaming for Long AI Calls
Any AI call expected to exceed 3 seconds MUST use streaming:
```typescript
// FRQ grading: always streamed
export async function POST(req: NextRequest) {
  const stream = await callAIStream({
    route: 'frq_grading',
    messages: [...]
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
}

// Client: use useStreamingText hook
const { text, isStreaming } = useStreamingText('/api/grade-frq', payload);
```

### Parallel AI Calls
```typescript
// CORRECT: Parallel where independent
const [prediction, studyPlan] = await Promise.all([
  callAI({ route: 'score_prediction', messages: predictMessages }),
  callAI({ route: 'study_plan_generation', messages: planMessages })
]);

// WRONG: Sequential when independent
const prediction = await callAI({ route: 'score_prediction', ... });
const studyPlan = await callAI({ route: 'study_plan_generation', ... }); // waits unnecessarily
```

### Request Deduplication
Use React Query's built-in deduplication — never trigger the same AI call twice for the same input within the same session.

---

## Performance Monitoring

### Required Instrumentation
Every API route tracks these metrics (logged to `api_performance_log` table):
```typescript
// lib/monitoring/trackPerformance.ts
export async function withPerformanceTracking<T>(
  routeName: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Non-blocking log
    logPerformance({ route: routeName, duration_ms: duration, status: 'success' }).catch(console.error);
    
    // Alert if budget exceeded
    if (duration > PERFORMANCE_BUDGETS[routeName]?.p99) {
      console.warn(`[PERF] ${routeName} exceeded p99 budget: ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logPerformance({ route: routeName, duration_ms: duration, status: 'error' }).catch(console.error);
    throw error;
  }
}
```

### Performance Budget Enforcement in CI
- Lighthouse CI runs on every PR targeting `main`
- LCP > 2.5s fails the build
- Bundle analyzer runs on every build — bundle diff shown in PR comment
- Any route that exceeds its p99 budget 3x in a 24-hour window creates an automatic GitHub issue

---

*AceOS — Performance Standards v1.0 | April 2026*
