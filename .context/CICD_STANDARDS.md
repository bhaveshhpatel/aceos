# CI/CD STANDARDS
## AceOS — Continuous Integration & Deployment Reference
### Version 1.0 | Principal Engineer Authority Document

---

## Branch Strategy

```
main          ← production. Protected. Requires PR + passing CI + 1 approval.
staging       ← pre-production. Auto-deploys to Vercel preview. Used for QA.
feature/*     ← all development work. Branched from main.
fix/*         ← bug fixes. Branched from main.
hot-fix/*     ← emergency production fixes. Branched from main, merged to main directly.
```

### Branch Rules
- `main` is protected: no direct pushes. All changes via PR.
- PR to `main` requires: CI passing + 1 human approval
- PR titles follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Squash merge to `main` always — clean linear history
- Branches are deleted after merge
- Maximum branch lifetime: 5 days. Longer = must rebase and justify.

---

## CI Pipeline (GitHub Actions)

### Full Pipeline (runs on every PR to `main`)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint                  # ESLint — zero errors
      - run: pnpm type-check             # tsc --noEmit — zero type errors
      - run: pnpm format:check           # Prettier — consistent formatting

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '${{ env.PNPM_VERSION }}' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level high   # Fails on high/critical vulnerabilities
      - uses: trufflesecurity/trufflehog-actions-scan@main  # Secret scanning
        with: { base: main, head: HEAD }

  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '${{ env.PNPM_VERSION }}' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
      # Fail if coverage drops below threshold
      - run: pnpm test:coverage-check

  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '${{ env.PNPM_VERSION }}' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:integration

  test-e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: [quality, test-unit]
    env:
      BASE_URL: ${{ secrets.STAGING_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '${{ env.PNPM_VERSION }}' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: [quality]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '${{ env.PNPM_VERSION }}' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Analyze bundle
        run: pnpm bundle-analyze
        # Posts bundle size diff as PR comment

  lighthouse:
    name: Lighthouse Performance
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v11
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: lighthouserc.json
```

### Lighthouse Config (`lighthouserc.json`)
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

---

## Test Coverage Requirements

### Minimum Coverage Thresholds (enforced in CI)
```json
// jest.config.ts / vitest.config.ts — coverage thresholds
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    // Critical paths have higher requirements
    "./lib/ai/": {
      "branches": 95,
      "functions": 95,
      "lines": 95
    },
    "./lib/auth/": {
      "branches": 95,
      "functions": 95,
      "lines": 95
    },
    "./app/api/": {
      "branches": 90,
      "functions": 90,
      "lines": 90
    }
  }
}
```

---

## Database Migration Standards

### Migration Rules
- Every migration is forward-only. No down migrations in production.
- Migration files are named: `YYYYMMDD_description.sql` (e.g., `20260103_create_ai_usage_log.sql`)
- Every migration is reviewed in PR before merging
- Migrations run automatically on Supabase via GitHub Action on merge to `main`
- Destructive changes (DROP TABLE, DROP COLUMN) require a separate PR with a 24hr review window

### Migration CI Job
```yaml
  migrate:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    needs: [test-integration]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Apply migrations
        run: |
          pnpm supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

## Deployment Standards

### Vercel Deployment Rules
- `main` auto-deploys to production on merge
- Every PR gets a unique preview URL via Vercel
- Production deployments require CI to pass (enforced via Vercel GitHub integration)
- Rollback: `vercel rollback` command available — restores previous deployment in < 30 seconds
- Environment variables are managed in Vercel dashboard — never in code

### Deployment Health Check
Post-deployment, this sequence runs automatically:
1. Health check endpoint `/api/health` polled for 60 seconds
2. If health check fails: automatic rollback triggered
3. Slack notification sent on both successful deploy and rollback

### Zero-Downtime Rules
- Database migrations that add columns must use `DEFAULT` or be `NULLABLE` (never add a NOT NULL column without a default to an existing table in a single migration)
- New API routes are additive — old routes stay alive during transitions
- Feature flags via environment variables for any feature that changes existing behavior

---

## Environment Variable Standards

### Environment Naming Convention
```bash
# Server-only secrets — never NEXT_PUBLIC_
OPENAI_API_KEY=
GROQ_API_KEY=
MODAL_SANDBOX_URL=
MODAL_API_KEY=
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
LOG_HASH_SALT=

# Client-safe (non-secret, non-PII)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_VERSION=
NEXT_PUBLIC_ENVIRONMENT=
```

### Rules
- `.env.example` is always up to date with all required keys (empty values)
- `.env.local` is gitignored, never committed
- New environment variable requires: (1) add to `.env.example`, (2) add to Vercel dashboard, (3) document in the relevant standards file
- CI validates that all required env vars are set before running tests (startup check)

---

## What Blocks a Merge to `main`

All of these must pass. Any one failure = PR cannot merge:

- [ ] ESLint: zero errors (warnings are OK but tracked)
- [ ] TypeScript: zero type errors (`tsc --noEmit`)
- [ ] Prettier: all files formatted
- [ ] Unit tests: all pass + coverage thresholds met
- [ ] Integration tests: all pass
- [ ] Security audit: zero high/critical vulnerabilities
- [ ] Secret scanning: no secrets detected in diff
- [ ] Build: Next.js build succeeds
- [ ] Lighthouse: performance score ≥ 85, LCP ≤ 2.5s
- [ ] 1 human approval on PR

---

*AceOS — CI/CD Standards v1.0 | April 2026*
