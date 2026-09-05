## 2026-09-05 - Configurable Retry Backoff for AI Gateway Test Execution Speedup
**Learning:** AI Gateway retries with hardcoded backoff durations (e.g. 1000ms exponential backoff) executed real-time `setTimeout` delays in unit test suites, causing test runs to stall for 9+ seconds.
**Action:** Expose an optional `retryBackoffMs` configuration property on `AIRequest` in `lib/ai/gateway.ts` (defaulting to 1000ms in production) and set `retryBackoffMs: 0` in unit tests to eliminate unneeded timer delays.
