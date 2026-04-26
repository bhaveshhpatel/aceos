# AceOS — Plugability Standards

> **Core principle:** Swapping any vendor, AI model, analytics tool, email provider, or payment processor must require zero application code changes. Configuration changes only.

---

## 1. The Plugability Contract

For any component to be considered "plugable" in AceOS, it must satisfy all four conditions:

1. **Interface-defined:** A TypeScript interface in `lib/providers/[service]/interface.ts` defines the contract.
2. **Provider-implemented:** Each vendor has its own file implementing the interface.
3. **Config-routed:** `config/[service].config.ts` reads an environment variable to select the active provider.
4. **Null-provdier exists:** A no-op `null.ts` provider exists for testing environments where the real service should not be called.

If any of these four conditions is missing, the component is not plugable.

---

## 2. Current Plugable Components

### 2.1 AI Gateway (Most Critical)
**Config file:** `config/model_map.json`  
**Swap mechanism:** Environment variable `AI_PROVIDER_OVERRIDE` or direct edit of `model_map.json`  
**What can be swapped:** Any individual route (frq_grading, wrong_answer_explainer, etc.) independently

```json
// To swap FRQ grading from GPT-4o to Claude Sonnet:
// ONLY change this in model_map.json:
"frq_grading": {
  "provider": "anthropic",    // was "openai"
  "model": "claude-sonnet-4", // was "gpt-4o"
  "max_tokens": 2000,
  "temperature": 0.2
}
// Add anthropic to providers block with its env_key
// Zero TypeScript changes required
```

**Provider files:**
```
lib/providers/ai/
├── interface.ts           # AIProvider interface
├── openai.ts
├── anthropic.ts           # add when needed
├── groq.ts
├── google.ts              # add when needed
└── null.ts                # for tests
```

### 2.2 Analytics
**Config file:** `config/analytics.config.ts`  
**Env var:** `ANALYTICS_PROVIDER=posthog|mixpanel|amplitude|null`

```typescript
// lib/providers/analytics/interface.ts
export interface AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  page(name: string, properties?: Record<string, unknown>): void;
  group(groupId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}
```

### 2.3 Email / Transactional Messaging
**Config file:** `config/email.config.ts`  
**Env var:** `EMAIL_PROVIDER=resend|sendgrid|postmark|null`

```typescript
// lib/providers/email/interface.ts
export interface EmailProvider {
  send(params: EmailParams): Promise<EmailResult>;
  sendBatch(emails: EmailParams[]): Promise<EmailResult[]>;
}

export interface EmailParams {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface EmailResult {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
}
```

### 2.4 Payments
**Config file:** `config/payments.config.ts`  
**Env var:** `PAYMENT_PROVIDER=stripe|null`

```typescript
// lib/providers/payments/interface.ts
export interface PaymentProvider {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>;
  createPortalSession(customerId: string): Promise<PortalSession>;
  constructWebhookEvent(payload: string, signature: string): WebhookEvent;
  getSubscription(subscriptionId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}
```

### 2.5 Feature Flags
**Config file:** `config/flags.config.ts`  
**Env var:** `FLAGS_PROVIDER=posthog|launchdarkly|local|null`

```typescript
// lib/providers/flags/interface.ts
export interface FlagsProvider {
  isEnabled(flag: string, context?: FlagContext): Promise<boolean>;
  getVariant(flag: string, context?: FlagContext): Promise<string | null>;
  getAllFlags(context?: FlagContext): Promise<Record<string, boolean | string>>;
}

export interface FlagContext {
  userId?: string;
  studentId?: string;
  properties?: Record<string, unknown>;
}
```

### 2.6 Error Tracking
**Config file:** `config/monitoring.config.ts`  
**Env var:** `ERROR_TRACKER=sentry|datadog|null`

```typescript
// lib/providers/monitoring/interface.ts
export interface MonitoringProvider {
  captureException(error: Error, context?: ErrorContext): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string; email?: string }): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  startTransaction(name: string): Transaction;
}
```

### 2.7 File Storage
**Config file:** `config/storage.config.ts`  
**Env var:** `STORAGE_PROVIDER=supabase|s3|cloudflare-r2`

```typescript
// lib/providers/storage/interface.ts
export interface StorageProvider {
  upload(path: string, file: Buffer | Blob, options?: UploadOptions): Promise<StorageResult>;
  download(path: string): Promise<Buffer>;
  getSignedUrl(path: string, expiresInSeconds: number): Promise<string>;
  delete(path: string): Promise<void>;
  list(prefix: string): Promise<StorageItem[]>;
}
```

### 2.8 Background Jobs
**Config file:** `config/jobs.config.ts`  
**Env var:** `JOBS_PROVIDER=modal|inngest|null`

```typescript
// lib/providers/jobs/interface.ts
export interface JobsProvider {
  enqueue<T>(jobName: string, payload: T, options?: JobOptions): Promise<string>;
  schedule<T>(jobName: string, cron: string, payload?: T): Promise<string>;
  cancel(jobId: string): Promise<void>;
}
```

---

## 3. How to Add a New Provider

When a new vendor needs to be supported for an existing plugable component, follow this checklist:

```
[ ] 1. Create lib/providers/[service]/[vendor].ts
[ ] 2. Implement every method from lib/providers/[service]/interface.ts
[ ] 3. Add the vendor key to config/[service].config.ts providers map
[ ] 4. Add the new env var to .env.example with a comment
[ ] 5. Write unit tests in tests/unit/providers/[service]/[vendor].test.ts
[ ] 6. Update the README table in this file with the new provider
[ ] 7. Zero changes to application code (lib/, app/, components/)
```

If step 7 cannot be satisfied, the interface is too narrow — update the interface and all existing implementations before adding the new vendor.

---

## 4. How to Add a NEW Plugable Component

When a new service needs to become plugable:

```
[ ] 1. Define lib/providers/[service]/interface.ts — stable, minimal interface
[ ] 2. Create lib/providers/[service]/null.ts — no-op implementation
[ ] 3. Implement first real provider in lib/providers/[service]/[vendor].ts
[ ] 4. Create config/[service].config.ts with env var routing
[ ] 5. Add SERVICE_PROVIDER to .env.example
[ ] 6. Replace all direct vendor calls in codebase with config import
[ ] 7. Add tests for all providers
```

---

## 5. Null Provider Pattern

Every plugable service must have a null provider for use in tests and local development without credentials:

```typescript
// lib/providers/analytics/null.ts
import { AnalyticsProvider } from './interface';

export const nullAnalyticsProvider: AnalyticsProvider = {
  track: () => {},
  identify: () => {},
  page: () => {},
  group: () => {},
  reset: () => {}
};
```

Test files import from config (with `ANALYTICS_PROVIDER=null`), never directly from vendor implementations.

---

## 6. Environment Variable Naming Convention

```bash
# Format: [SERVICE]_PROVIDER
ANALYTICS_PROVIDER=posthog
EMAIL_PROVIDER=resend
PAYMENT_PROVIDER=stripe
FLAGS_PROVIDER=posthog
ERROR_TRACKER=sentry
STORAGE_PROVIDER=supabase
JOBS_PROVIDER=modal

# Then the provider-specific credentials:
POSTHOG_API_KEY=...
POSTHOG_HOST=https://app.posthog.com
RESEND_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SENTRY_DSN=...
```

---

## 7. What Is NOT Plugable (and Why)

| Component | Reason |
|---|---|---|
| Next.js | Framework is too foundational; migrating is a full rewrite |
| Supabase (Auth) | Auth provider switch requires data migration and user re-auth |
| FSRS-5 algorithm | Self-hosted, no vendor dependency |
| Modal.com (STEM sandbox) | The Python execution model is specific to Modal; abstracted but tightly coupled by design |
| Tailwind CSS | Too deeply integrated into component design system |

Even "not plugable" components are still abstracted behind thin wrappers to make future migration less painful — but they don't get the full provider interface pattern.

---

*Last updated: April 2026 | AceOS Internal Standards*
