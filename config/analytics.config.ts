/**
 * analytics.config.ts
 * Pluggable analytics provider configuration.
 * Application code calls lib/providers/analytics — never calls PostHog directly.
 *
 * Swap provider: change ANALYTICS_PROVIDER env var. No code changes needed.
 */
export const analyticsConfig = {
  provider: (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? 'posthog') as 'posthog' | 'mixpanel' | 'none',
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '',
    host:   process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
  },
} as const;
