# AceOS — Testing Standards
## Test-Forward Engineering Reference | All Contributors

> **Philosophy:** Tests are not written after code. Tests define the contract, code fulfills it.
> If you cannot write a failing test before writing the code, you do not understand the requirement yet.

---

## 1. The Test-Forward Mandate

### Required Order of Operations (no exceptions)
1. **Read the story** (functional or technical)
2. **Write Gherkin scenarios** (Given/When/Then) — these are the acceptance criteria
3. **Write failing automated tests** derived from those Gherkin scenarios
4. **Write the implementation** until all tests pass
5. **Refactor** — tests stay green throughout

This is not optional. A PR that introduces code without accompanying tests for new behavior is rejected.

### What "Test-Forward" Does NOT Mean
- It does not mean 100% coverage of every line. Coverage is a proxy metric, not a goal.
- It does not mean testing implementation details. Test behavior, not internals.
- It does not mean mocking everything. Integration tests that hit a real Supabase test schema are preferred for DB logic.

---

## 2. Test Types & Ownership

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

## 3. Gherkin Standards

Every story must produce Gherkin scenarios before implementation begins. These scenarios are the single source of truth for acceptance.

### Scenario Writing Rules
- **Given** = pre-conditions (system state, user state, data state)
- **When** = the single action being tested
- **Then** = observable outcomes (what the user sees, what the DB contains, what the API returns)
- One scenario = one behavior. Do not test two things in one scenario.
- **No implementation details in Gherkin.** Scenarios describe WHAT, not HOW.

```gherkin
# ✅ CORRECT — describes behavior
Scenario: Student under 18 is redirected to parental consent
  Given a student enters age 16 during signup
  When they complete the email verification step
  Then a parental consent email is sent to the provided parent email
  And the student sees a "Waiting for parent approval" screen
  And the student cannot access the dashboard until consent is confirmed

# ❌ WRONG — describes implementation
Scenario: ParentalConsentService.send() is called with student_id
  Given the student object has age: 16
  When signupHandler() processes the POST body
  Then parentalConsentService.send(student.id) is called once
```

### Gherkin File Location
```
tests/
├── features/
│   ├── auth/
│   │   ├── student_signup.feature
│   │   └── parental_consent.feature
│   ├── diagnostic/
│   │   ├── text_diagnostic.feature
│   │   └── stem_diagnostic.feature
│   └── frq/
│       ├── humanities_grader.feature
│       └── stem_grader.feature
```

---

## 4. Unit Test Standards

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
      const incomplete = { subject: 'AP US History' }; // missing 4 vars

      expect(() => renderPrompt('frq_humanities_grader', incomplete))
        .toThrow(/rubric/);
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

## 5. Integration Test Standards

### Supabase Test Schema
All integration tests run against a **dedicated test schema** (`test_<branch_name>`), never production.

```typescript
// tests/setup/supabase-test-client.ts
import { createClient } from '@supabase/supabase-js';

export const testSupabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_SERVICE_KEY!  // service key for test setup only
);

// Before each test suite: seed test data
// After each test suite: truncate test tables
```

### API Route Integration Tests
```typescript
// tests/integration/api/validate-stem.test.ts
describe('POST /api/validate-stem', () => {
  beforeEach(async () => {
    // Create authenticated test user
    testUser = await createTestUser({ email: 'test@aceos.io' });
  });

  afterEach(async () => {
    await cleanupTestUser(testUser.id);
  });

  it('returns correct: true for matching numerical answer', async () => {
    const response = await fetch('/api/validate-stem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': testUser.sessionCookie
      },
      body: JSON.stringify({
        subject_type: 'AP Calculus AB',
        student_answer: '12',
        correct_answer: '12',
        answer_type: 'numerical'
      })
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.correct).toBe(true);
  });

  it('returns 401 for unauthenticated request', async () => {
    const response = await fetch('/api/validate-stem', {
      method: 'POST',
      body: JSON.stringify({ student_answer: '12' })
    });
    expect(response.status).toBe(401);
  });
});
```

### AI Gateway Mocking
**Never make live AI calls in tests.** All AI calls are mocked at the `callAI` boundary.

```typescript
// tests/mocks/ai-gateway.ts
import { vi } from 'vitest';
import * as gateway from '@/lib/ai/gateway';

export function mockCallAI(response: Partial<AIResponse>) {
  return vi.spyOn(gateway, 'callAI').mockResolvedValue({
    content: response.content ?? '',
    model_used: 'gpt-4o',
    provider: 'openai',
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    latency_ms: 450,
    ...response
  });
}

// Usage in test
const spy = mockCallAI({ content: JSON.stringify(validFRQResponse) });
// ... test code ...
expect(spy).toHaveBeenCalledWith(expect.objectContaining({ route: 'frq_grading' }));
```

### Modal Sandbox Mocking
```typescript
// tests/mocks/modal-sandbox.ts
export function mockModalSandbox(result: { correct: boolean | null; error?: string }) {
  return vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
    if (String(url).includes('modal.run')) {
      return new Response(JSON.stringify(result), { status: 200 });
    }
    return originalFetch(url);
  });
}
```

---

## 6. E2E Test Standards

### Tool: Playwright
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['github']],
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

| Flow | Scenarios | Priority |
|---|---|---|
| Student signup (18+) | Email signup → verify → dashboard | P0 |
| Student signup (<18) | Email signup → parental consent gate → blocked dashboard | P0 |
| Google OAuth signup | OAuth flow → subject selection → dashboard | P0 |
| Diagnostic completion | Select subject → complete 50q → see heatmap + score | P0 |
| FRQ submission + grading | Submit essay → receive rubric heatmap within 60s | P0 |
| STEM answer submission | Submit typed answer → see validation result | P1 |
| Error recovery | AI returns error → student sees retry UI → retry succeeds | P1 |
| Parental consent flow | Parent receives email → clicks confirm → student unblocked | P1 |

### Page Object Pattern (required for all E2E tests)
```typescript
// tests/e2e/pages/signup-page.ts
export class SignupPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/auth/signup'); }

  async fillEmail(email: string) {
    await this.page.getByLabel('Email address').fill(email);
  }

  async fillAge(age: number) {
    await this.page.getByLabel('Your age').fill(String(age));
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Create account' }).click();
  }

  async waitForParentalConsentScreen() {
    await this.page.waitForSelector('[data-testid="parental-consent-pending"]');
  }
}
```

### Data Test IDs
Every interactive and key display element must have `data-testid` attributes:
```tsx
<button data-testid="submit-frq" onClick={handleSubmit}>Submit Essay</button>
<div data-testid="rubric-heatmap" aria-label="Rubric score breakdown">{...}</div>
<div data-testid="parental-consent-pending">{...}</div>
```

Never use CSS selectors or XPaths in E2E tests. Always use `data-testid` or ARIA roles.

---

## 7. Accessibility Testing

### Standard: WCAG 2.1 AA

Every key user flow must pass axe-core automated accessibility scan.

```typescript
// tests/e2e/accessibility/signup.a11y.test.ts
import { checkA11y } from 'axe-playwright';

test('signup page has no accessibility violations', async ({ page }) => {
  await page.goto('/auth/signup');
  await checkA11y(page, undefined, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    detailedReport: true
  });
});
```

### Manual A11y Checklist (per major feature)
- [ ] All interactive elements reachable by keyboard
- [ ] Focus order is logical
- [ ] All images have `alt` text
- [ ] Color is not the only means of conveying information (error states use icons + text)
- [ ] AI error states use `role="alert"` and `aria-live="assertive"`
- [ ] Loading states use `aria-busy="true"`
- [ ] Forms have proper `<label>` associations

---

## 8. CI Test Execution Order

```yaml
# .github/workflows/ci.yml — test stage order
jobs:
  test:
    steps:
      - name: Type check        # tsc --noEmit — fails fast on type errors
      - name: Lint              # ESLint — code quality gate
      - name: Unit tests        # vitest run — <2 minutes
      - name: Integration tests # vitest run --config vitest.integration.config.ts — <5 minutes
      - name: Coverage check    # fails if below thresholds
      - name: Build             # next build — catches SSR issues
      - name: E2E tests         # playwright test — runs against built app — <10 minutes
```

**Total CI target: < 18 minutes.** If it exceeds this, tests are parallelized further.

### Test Environment Variables
```bash
# .env.test — committed to repo (no secrets)
NODE_ENV=test
SUPABASE_URL=http://localhost:54321           # local Supabase via `supabase start`
SUPABASE_ANON_KEY=<local-anon-key>           # from `supabase status`
SUPABASE_SERVICE_KEY=<local-service-key>     # for test setup/teardown only
E2E_BASE_URL=http://localhost:3000
OPENAI_API_KEY=test-mock-key                 # mocked in all tests
GROQ_API_KEY=test-mock-key
MODAL_SANDBOX_URL=http://localhost:3001/mock  # local mock server
```

---

## 9. Test Data Management

### Fixtures (static)
- Stored in `tests/fixtures/`
- Used for known-good AI responses, diagnostic questions, rubric templates
- Never contain real student data

### Factories (dynamic)
```typescript
// tests/factories/student.factory.ts
export async function createTestStudent(overrides: Partial<Student> = {}): Promise<TestStudent> {
  const defaults: Omit<Student, 'id' | 'created_at'> = {
    email: `test+${Date.now()}@aceos.io`,
    age: 17,
    ap_subjects: ['AP US History'],
    parental_consent_confirmed: false,
    ...overrides
  };
  // insert into test schema, return with cleanup function
  const { data } = await testSupabase.from('students').insert(defaults).select().single();
  return {
    ...data,
    cleanup: () => testSupabase.from('students').delete().eq('id', data.id)
  };
}
```

### Database Isolation
- Each integration test suite runs in a transaction that is rolled back after the suite.
- Never rely on test ordering. Every test must be independently runnable.
- Never share state between tests via module-level variables.

---

*AceOS Testing Standards | Version 1.0 | April 2026*
*Owned by: Lead Engineer | Review cycle: per major phase*
