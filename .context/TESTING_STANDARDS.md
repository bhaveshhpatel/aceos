# AceOS — Testing Standards
## Test-Forward Engineering Reference | All Contributors

> **Philosophy:** Tests are not written after code. Tests define the contract, code fulfills it.
> If you cannot write a failing test before writing the code, you do not understand the requirement yet.

---

## 1. The Test-Forward Mandate

### Required Order of Operations (no exceptions)
1. **Read the story** (functional or technical)
2. **Write Gherkin `.feature` file** — one file per story, in `tests/gherkin/`
3. **Classify each scenario** to its test layer (see Section 2 — Automation Mapping)
4. **Write failing automated tests** derived from those Gherkin scenarios
5. **Write the implementation** until all tests pass (RED → GREEN)
6. **Refactor** — tests stay green throughout
7. **Verify story DoD checklist** — all items checked before story is marked Done

This is not optional. A PR that introduces code without accompanying tests for new behavior is rejected.

### What "Test-Forward" Does NOT Mean
- It does not mean 100% coverage of every line. Coverage is a proxy metric, not a goal.
- It does not mean testing implementation details. Test behavior, not internals.
- It does not mean mocking everything. Integration tests that hit a real Supabase test schema are preferred for DB logic.

---

## 2. The Three-Layer Test Pyramid

Every story gets three layers of automation. They are written and executed in this order:

```
         ┌─────────────────────────────┐
         │         E2E / Playwright     │  ← Full user journeys, browser-driven
         │  Slowest · Highest confidence│    Written last, gate before sprint Done
         └─────────────────────────────┘
      ┌─────────────────────────────────────┐
      │     Integration Tests (Vitest)       │  ← API routes + DB via real test schema
      │  Medium speed · Medium confidence    │    Written after unit tests pass
      └─────────────────────────────────────┘
   ┌─────────────────────────────────────────────┐
   │          Unit Tests (Vitest)                 │  ← Pure logic, mocked boundaries
   │  Fastest · Tests one thing at a time         │    Written FIRST, before implementation
   └─────────────────────────────────────────────┘
```

### Automation Mapping — Which Layer Per Story Type

| Story Type | Primary Layer | Secondary Layer | E2E |
|---|---|---|---|
| Functional (FS) — UI flows | Playwright E2E | Integration (API contract) | Full flow |
| Technical (TS) — API / infra | Vitest unit + Integration | — | Smoke only |
| DB / Schema (TS migration) | Integration (real Supabase test) | — | None |
| AI pipeline (gateway, prompts) | Vitest unit (mocked gateway) | Integration (real fixture) | None |
| STEM validation (Modal sandbox) | Vitest unit + Integration | — | Smoke only |
| Auth flows | Integration (Supabase test) | Playwright E2E | Full flow |
| Error handling / boundaries | Vitest unit | Playwright E2E (negative path) | Negative scenario |

---

## 3. Gherkin Standards

### The Prime Directive for Gherkin
**Gherkin describes observable behavior at the system boundary — not implementation details, not UI mechanics.**
If a scenario can only be validated by reading source code, it is written at the wrong level.

### Scenario Quality Rules
- **Given** = pre-conditions — system state, user state, data state. What is true before the action.
- **When** = the single action under test. One When per scenario. No "and then".
- **Then** = observable outcomes. What the user sees, what the DB contains, what the API returns. Never "X function was called."
- One scenario = one behavior. Never test two distinct outcomes in one scenario.
- No implementation details. Scenarios describe WHAT, not HOW.
- Every scenario must be directly automatable — if you cannot point to a specific assertion for every Then, rewrite it.

```gherkin
# ✅ CORRECT — observable behavior at system boundary
Scenario: Minor student is gated at parental consent before accessing dashboard
  Given a student signs up with a date of birth 15 years ago
  And they provide parent email "parent@example.com"
  When signup completes
  Then they are shown the parental consent waiting screen
  And the dashboard is not accessible
  And a consent email is sent to "parent@example.com" within 30 seconds

# ❌ WRONG — tests implementation, not behavior
Scenario: ParentalConsentService.send() is called with student_id
  Given the student object has age: 15
  When signupHandler() processes the POST body
  Then parentalConsentService.send(student.id) is called once
```

### Gherkin File Structure
```
tests/gherkin/
├── sprint-1/
│   ├── functional/
│   │   ├── S1-F-01_email_signup.feature
│   │   ├── S1-F-02_google_oauth.feature
│   │   ├── S1-F-03_age_gate_consent.feature
│   │   ├── S1-F-04_email_verification.feature
│   │   ├── S1-F-05_subject_selection.feature
│   │   ├── S1-F-06_dashboard_shell.feature
│   │   ├── S1-F-07_session_persistence.feature
│   │   ├── S1-F-08_tos_acceptance.feature
│   │   ├── S1-F-09_parental_consent_email.feature
│   │   └── S1-F-10_password_recovery.feature
│   └── technical/
│       ├── T1-1_supabase_schema_rls.feature
│       ├── T1-2_vercel_ci_pipeline.feature
│       ├── T1-3_litellm_gateway.feature
│       ├── T1-4_auth_system.feature
│       ├── T1-5_subject_selection_backend.feature
│       ├── T1-6_legal_pages.feature
│       ├── T1-7_profile_trigger.feature
│       └── T1-8_error_boundaries.feature
└── sprint-2/
    ├── functional/
    │   └── (Sprint 2 functional feature files)
    └── technical/
        ├── TS2-01_modal_sandbox.feature
        ├── TS2-02_litellm_gateway_v2.feature
        ├── TS2-03_prompt_template_system.feature
        ├── TS2-04_ai_error_handling.feature
        └── TS2-05_qa_pipeline.feature
```

### Gherkin File Header (required on every .feature file)
```gherkin
# Story: S1-F-03 — Age Gate & Parental Consent Flow
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: YYYY-MM-DD

Feature: Age Gate & Parental Consent Flow
  As a student under 18
  I want my signup to trigger a parental consent gate
  So that AceOS is FERPA-compliant before storing any of my data
```

### Gherkin → Test Mapping Table (required per feature file, at top as a comment)
```gherkin
# Automation Map:
# Scenario 1 → tests/e2e/auth/consent.spec.ts → ConsentPage.minorRedirectedToConsent()
# Scenario 2 → tests/integration/api/auth.test.ts → 'POST /api/auth/signup minor flow'
# Scenario 3 → tests/unit/consent.test.ts → 'sendConsentEmail validates parent email'
```

---

## 4. RED → GREEN → REFACTOR Workflow (Per Story)

This is the non-negotiable execution sequence for every story:

```
Step 1: Feature file written + reviewed (PR comment or sync)
         ↓
Step 2: Unit tests written → run → ALL RED
         (Implementation does not exist. Tests prove they test something.)
         ↓
Step 3: Implementation written → unit tests go GREEN
         ↓
Step 4: Integration tests written → GREEN
         ↓
Step 5: E2E tests written (if applicable) → GREEN
         ↓
Step 6: PR opened → CI runs full suite → must pass
         ↓
Step 7: Story DoD checklist verified → story marked Done
```

**The discipline trap:** Step 2 (writing tests RED before any implementation) gets skipped because it feels wasteful. Do not skip it. A test that was never RED has never proven it tests anything. It may be permanently green because it never actually exercises the code.

---

## 5. Test Types & Ownership

| Type | Tool | What It Tests | Speed | Location |
|---|---|---|---|---|
| **Unit** | Vitest | Pure functions, utilities, validators, prompt rendering | <50ms/test | Co-located: `*.test.ts` next to source |
| **Integration** | Vitest + Supabase test schema | API routes, DB repositories, auth flows | <500ms/test | `tests/integration/` |
| **E2E** | Playwright | Full user journeys through the browser | <30s/flow | `tests/e2e/` |
| **Contract** | Zod schemas | AI response shape, third-party API response shape | <50ms | Co-located with schema files |
| **Accessibility** | axe-core + Playwright | WCAG 2.1 AA compliance on key flows | In E2E suite | `tests/e2e/accessibility/` |

### Coverage Targets
| Layer | Minimum Branch Coverage |
|---|---|
| `lib/ai/` (gateway, prompts, errors) | **90%** |
| `lib/db/` (all repository functions) | **90%** |
| `app/api/` (all Route Handlers) | **85%** |
| `components/features/` | **70%** |
| `components/ui/` | **60%** |

These are enforced in CI. A build that drops below these thresholds fails.

---

## 6. Unit Test Standards

### Tool: Vitest
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        branches: 85,
        functions: 85,
        lines: 85
      },
      exclude: [
        'node_modules/', '.next/', 'tests/', '**/*.d.ts',
        '**/*.config.*', '**/types/**'
      ]
    }
  }
});
```

### Unit Test Structure (AAA Pattern)
```typescript
describe('renderPrompt', () => {
  describe('when all required variables are provided', () => {
    it('returns rendered system and user strings with no unreplaced tokens', () => {
      // Arrange
      const variables = {
        subject: 'AP US History',
        frq_type: 'DBQ',
        prompt: 'Analyze the causes...',
        rubric: 'Thesis (1pt)...',
        student_response: 'The Civil War was caused by...'
      };
      // Act
      const result = renderPrompt('frq_humanities_grader', variables);
      // Assert
      expect(result.user).not.toMatch(/\{\{\w+\}\}/);
      expect(result.system).not.toBe('');
    });
  });

  describe('when a required variable is missing', () => {
    it('throws an error naming the missing variable', () => {
      const incomplete = { subject: 'AP US History' };
      expect(() => renderPrompt('frq_humanities_grader', incomplete)).toThrow(/rubric/);
    });
  });
});
```

### What to Unit Test
- All pure utility functions in `lib/`
- Prompt rendering and variable substitution
- Error classification logic
- ACE-Rank calculation algorithm
- FSRS-5 interval computation
- Zod schema validation (both valid and invalid inputs)
- All config-driven routing logic (model_map parsing)

### What NOT to Unit Test
- React component rendering in isolation (too fragile, low value)
- Database query result shapes (integration test territory)
- AI model responses (mock the gateway, not the model)

---

## 7. Integration Test Standards

### Supabase Test Schema
All integration tests run against a **dedicated test schema**, never production.

```typescript
// tests/setup/supabase-test-client.ts
import { createClient } from '@supabase/supabase-js';
export const testSupabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_SERVICE_KEY!
);
```

### AI Gateway Mocking
**Never make live AI calls in tests.** All AI calls are mocked at the `callAI` boundary.

```typescript
// tests/mocks/ai-gateway.ts
export function mockCallAI(response: Partial<AIResponse>) {
  return vi.spyOn(gateway, 'callAI').mockResolvedValue({
    content: response.content ?? '',
    model_used: 'gpt-4o',
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    latency_ms: 450,
    ...response
  });
}
```

### AI-Specific Test Strategy
The AI pipeline requires a distinct approach because LLM output is non-deterministic:

| Test Goal | Approach | Note |
|---|---|---|
| Prompt rendering | Unit test renderPrompt() with known variables | Fast, deterministic |
| Schema validation | Unit test Zod parsers with valid + invalid fixtures | Tests shape, not content |
| Error handling | Unit test with mocked callAI() throwing AIError variants | Mocked boundary |
| Gateway routing | Unit test model_map.json parsing | Deterministic config |
| Real AI quality gate | 50-question QA harness (scripts/qa/) | Manual / scheduled only — NOT on every PR |

**The 50-question QA gate is NOT a CI gate.** It runs manually or on a weekly schedule. It is too slow and too expensive for every PR. It is a quality signal, not a merge blocker.

---

## 8. E2E Test Standards

### Tool: Playwright
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } }
  ]
});
```

### Mandatory E2E Flows (must pass before every deploy)

| Flow | Priority |
|---|---|
| Email signup (18+) → verify → dashboard | P0 |
| Email signup (<18) → parental consent gate → blocked dashboard | P0 |
| Google OAuth signup → subject selection → dashboard | P0 |
| Diagnostic completion → heatmap + score | P0 |
| FRQ submission + grading (streamed) | P0 |
| STEM answer submission + validation result | P1 |
| AI error → retry UI → retry succeeds | P1 |
| Parental consent full flow (approve + deny) | P1 |

### Page Object Pattern (required for all E2E tests)
```typescript
// tests/e2e/pages/signup-page.ts
export class SignupPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/auth/signup'); }
  async fillEmail(email: string) { await this.page.getByLabel('Email address').fill(email); }
  async submit() { await this.page.getByRole('button', { name: 'Create account' }).click(); }
}
```

### Data Test IDs (required on all interactive + key display elements)
```tsx
<button data-testid="submit-frq">Submit Essay</button>
<div data-testid="rubric-heatmap">...</div>
<div data-testid="parental-consent-pending">...</div>
```
Never use CSS selectors or XPaths in E2E tests. Always `data-testid` or ARIA roles.

---

## 9. Accessibility Testing

### Standard: WCAG 2.1 AA

```typescript
// tests/e2e/accessibility/signup.a11y.test.ts
import { checkA11y } from 'axe-playwright';
test('signup page has no accessibility violations', async ({ page }) => {
  await page.goto('/auth/signup');
  await checkA11y(page, undefined, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
  });
});
```

### Manual A11y Checklist (per major feature)
- [ ] All interactive elements reachable by keyboard
- [ ] Focus order is logical
- [ ] All images have `alt` text
- [ ] Color is not the only means of conveying information
- [ ] AI error states use `role="alert"` and `aria-live="assertive"`
- [ ] Loading states use `aria-busy="true"`
- [ ] Forms have proper `<label>` associations

---

## 10. CI Test Execution Order

```
Type check → Lint → Unit tests → Integration tests → Coverage check → Build → E2E tests
```

**Total CI target: < 18 minutes.**

### Test Environment Variables
```bash
# .env.test — committed to repo (no secrets)
NODE_ENV=test
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_KEY=<local-service-key>
E2E_BASE_URL=http://localhost:3000
OPENAI_API_KEY=test-mock-key
GROQ_API_KEY=test-mock-key
MODAL_SANDBOX_URL=http://localhost:3001/mock
```

---

## 11. Test Data Management

### Factories (dynamic)
```typescript
// tests/factories/student.factory.ts
export async function createTestStudent(overrides = {}) {
  const defaults = {
    email: `test+${Date.now()}@aceos.io`,
    age: 17,
    ap_subjects: ['AP US History'],
    parental_consent_confirmed: false,
    ...overrides
  };
  const { data } = await testSupabase.from('students').insert(defaults).select().single();
  return { ...data, cleanup: () => testSupabase.from('students').delete().eq('id', data.id) };
}
```

### Database Isolation
- Each integration test suite runs in a transaction rolled back after the suite
- Never rely on test ordering — every test must be independently runnable
- Never share state between tests via module-level variables

---

## 12. Story Done Definition (Test Gates)

A story is NOT done until:
- [ ] `.feature` file exists in `tests/gherkin/` matching every acceptance criterion
- [ ] Automation mapping comment in feature file matches actual test file locations
- [ ] All scenarios have corresponding automated tests (unit / integration / E2E as mapped)
- [ ] All tests are GREEN in CI
- [ ] Coverage thresholds pass for affected paths
- [ ] E2E Playwright test covers the full user journey (for Functional stories)
- [ ] `data-testid` attributes on all new interactive elements
- [ ] Accessibility check passes on new pages

---

*AceOS Testing Standards | Version 2.0 | April 2026*
*Owned by: Lead Engineer | Review cycle: per major phase*
