# AceOS — Database Standards
## Principal Engineer Reference | Supabase/PostgreSQL

> **Rule zero:** The database is the source of truth. All other layers are derived from it. Treat schema changes with the same rigor as production code deployments.

---

## 1. Schema Design Principles

### Naming Conventions
| Entity | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `students`, `frq_submissions`, `ai_usage_logs` |
| Columns | `snake_case` | `student_id`, `created_at`, `mastery_score` |
| Indexes | `idx_{table}_{column(s)}` | `idx_frq_submissions_student_created` |
| Foreign keys | `fk_{table}_{referenced_table}` | `fk_sip_units_students` |
| RLS policies | descriptive strings | `"Students can read own profile"` |
| Migrations | `YYYYMMDD_NNN_description.sql` | `20260101_001_create_students.sql` |

### Primary Keys
- **All tables use `UUID` primary keys** generated with `gen_random_uuid()`.
- Never use sequential integers as primary keys for any table that references students. UUIDs prevent enumeration attacks.

### Timestamps
Every table must have:
```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

A trigger maintains `updated_at` automatically:
```sql
-- migrations/00000001_shared_triggers.sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table:
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Soft Deletes
- Tables that represent user-generated content (submissions, study sessions) use soft deletes.
- Add `deleted_at TIMESTAMPTZ` column. NULL = not deleted.
- All queries against these tables must filter `WHERE deleted_at IS NULL`.
- Hard delete is only used for PII deletion requests (FERPA right to erasure).

---

## 2. Row-Level Security (RLS) — Non-Negotiable

**Every table must have RLS enabled before it ships.** No table goes to production without RLS policies.

### Standard Policy Patterns

```sql
-- Pattern 1: Student owns their own data
ALTER TABLE frq_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own submissions"
  ON frq_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own submissions"
  ON frq_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students cannot update or delete submissions"
  -- No UPDATE/DELETE policy = no access (RLS deny-by-default)
  ;

-- Pattern 2: Parent can read child's data (with consent flag)
CREATE POLICY "Parents can read consented child data"
  ON student_profiles FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM parent_student_links
      WHERE parent_id = auth.uid()
        AND child_id = student_profiles.student_id
        AND consent_confirmed = true
    )
  );

-- Pattern 3: Service role bypass (for server-side operations only)
CREATE POLICY "Service role full access"
  ON ai_usage_log
  USING (auth.role() = 'service_role');
```

### RLS Testing Requirement
Every new table's RLS policies must be tested with integration tests that:
1. Confirm a student CAN access their own data
2. Confirm a student CANNOT access another student's data
3. Confirm unauthenticated access is denied
4. Confirm service role can access all rows (for admin operations)

---

## 3. Migration Standards

### Migration Rules
- **Every schema change is a migration file.** No schema changes via Supabase Studio UI in production.
- **Migrations are append-only.** Never edit a migration that has already been applied to production.
- **Every migration must be reversible** (include `DOWN` logic as a comment, even if not executed automatically).
- **Migrations run in CI** before integration tests. A failed migration fails the build.

### Migration File Structure
```sql
-- migrations/20260101_002_create_frq_submissions.sql
-- Description: Creates the frq_submissions table for storing student FRQ responses
-- Author: Lead Engineer
-- Reversible: Yes (see DOWN section)

-- UP
CREATE TABLE frq_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  frq_type        TEXT NOT NULL CHECK (frq_type IN ('DBQ', 'LEQ', 'SAQ', 'FRQ')),
  prompt_text     TEXT NOT NULL,
  response_text   TEXT NOT NULL,
  rubric_id       UUID NOT NULL,
  score           SMALLINT,
  max_score       SMALLINT,
  grading_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (grading_status IN ('pending', 'graded', 'disputed', 'reviewed')),
  ai_model_used   TEXT,
  graded_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE frq_submissions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_frq_submissions_student_created
  ON frq_submissions (student_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_frq_submissions_grading_status
  ON frq_submissions (grading_status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER trg_frq_submissions_updated_at
  BEFORE UPDATE ON frq_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (see SECURITY_STANDARDS.md)
CREATE POLICY "Students can read own submissions"
  ON frq_submissions FOR SELECT
  USING (student_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Students can insert own submissions"
  ON frq_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Service role full access"
  ON frq_submissions USING (auth.role() = 'service_role');

-- DOWN (for manual rollback only)
-- DROP TABLE frq_submissions;
```

---

## 4. Repository Pattern (Data Access Layer)

**No component or API route accesses the database directly.** All database operations go through typed repository functions in `lib/db/`.

### Repository Structure
```
lib/db/
├── client.ts               # Supabase client factory (server + client variants)
├── repositories/
│   ├── students.repo.ts
│   ├── frq-submissions.repo.ts
│   ├── sip.repo.ts         # Student Intelligence Profile
│   ├── diagnostics.repo.ts
│   └── ai-usage.repo.ts
└── types/
    └── database.types.ts   # Auto-generated from Supabase CLI
```

### Repository Function Pattern
```typescript
// lib/db/repositories/frq-submissions.repo.ts
import { createClient } from '@/lib/db/client';
import type { Database } from '@/lib/db/types/database.types';
import type { FRQSubmission, CreateFRQSubmissionInput } from '@/types/frq';

type DB = Database['public']['Tables']['frq_submissions'];

/**
 * Creates a new FRQ submission record for the authenticated student.
 * @throws DatabaseError if insert fails
 */
export async function createFRQSubmission(
  input: CreateFRQSubmissionInput,
  studentId: string
): Promise<FRQSubmission> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('frq_submissions')
    .insert({
      student_id: studentId,
      subject: input.subject,
      frq_type: input.frqType,
      prompt_text: input.promptText,
      response_text: input.responseText,
      rubric_id: input.rubricId,
      grading_status: 'pending'
    })
    .select()
    .single();

  if (error) throw new DatabaseError('createFRQSubmission', error);
  return mapToFRQSubmission(data);
}

/**
 * Retrieves paginated FRQ submissions for a student, ordered by most recent.
 * Soft-deleted records are excluded.
 */
export async function getStudentFRQSubmissions(
  studentId: string,
  options: { page: number; pageSize: number; subject?: string }
): Promise<{ data: FRQSubmission[]; total: number }> {
  const supabase = createClient();
  const { page, pageSize, subject } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('frq_submissions')
    .select('*', { count: 'exact' })
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (subject) query = query.eq('subject', subject);

  const { data, error, count } = await query;
  if (error) throw new DatabaseError('getStudentFRQSubmissions', error);

  return { data: data.map(mapToFRQSubmission), total: count ?? 0 };
}
```

### Supabase Client Factory
```typescript
// lib/db/client.ts
import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types/database.types';

// Server-side client (Route Handlers, Server Components)
export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
}

// Service role client — ONLY for server-side admin operations
// Never exposed to client bundle
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
```

---

## 5. Query Performance Standards

### Mandatory Indexes
Every foreign key column must be indexed. Every column used in a `WHERE`, `ORDER BY`, or `JOIN` clause that operates on tables with > 10,000 expected rows must be indexed.

### Query Rules
- **No `SELECT *` in production code.** Always name the columns you need.
- **No unbounded queries.** Every query that returns multiple rows must have a `LIMIT` or `.range()`.
- **No N+1 queries.** If you fetch a list and then query per item in a loop, you have an N+1. Use joins or batch fetches.
- **Use `EXPLAIN ANALYZE` in development** before adding any query that operates on large tables.

### Pagination Standard
All list endpoints use cursor-based pagination for tables that will exceed 10,000 rows. Offset-based pagination (`LIMIT x OFFSET y`) degrades at scale.

```typescript
// Cursor-based pagination pattern
export async function getSubmissionsAfterCursor(
  studentId: string,
  cursor: string | null,   // cursor = created_at of last seen row
  limit: number = 20
): Promise<{ data: FRQSubmission[]; nextCursor: string | null }> {
  let query = supabase
    .from('frq_submissions')
    .select('*')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1);  // fetch one extra to determine if next page exists

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw new DatabaseError('getSubmissionsAfterCursor', error);

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? results[results.length - 1].created_at : null;

  return { data: results.map(mapToFRQSubmission), nextCursor };
}
```

---

## 6. FERPA Data Architecture

### Data Classification
| Data Type | Classification | Encryption | Access |
|---|---|---|---|
| Student email, name, age | PII | At rest (Supabase default) | Student + service role only |
| Grade data, GPA | Education Record (FERPA) | At rest | Student + consented parent |
| SIP mastery scores | Education Record (FERPA) | At rest | Student + consented parent |
| FRQ submission text | Education Record (FERPA) | At rest | Student + consented parent |
| Aggregated analytics | Anonymized — not FERPA | At rest | Internal service role only |
| AI usage logs | Internal | At rest | Service role only |

### PII Deletion (Right to Erasure)
When a student requests account deletion:
1. Hard delete PII columns (`email`, `name`, `date_of_birth`) — replace with `[DELETED]`
2. Retain anonymized records for aggregate analytics (no PII linkable)
3. Hard delete `parent_student_links`
4. Retain `ai_usage_log` with `student_id = NULL` for cost accounting
5. Log the deletion event in `account_deletion_audit_log` (for compliance)

---

## 7. Database Type Generation

Supabase CLI generates TypeScript types from the live schema. This runs in CI.

```bash
# Regenerate types after every migration
npx supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_ID \
  --schema public > lib/db/types/database.types.ts
```

The generated `database.types.ts` is committed to the repo. A PR that changes the schema without regenerating types fails CI.

---

*AceOS Database Standards | Version 1.0 | April 2026*
*Owned by: Lead Engineer | Review cycle: per major phase*
