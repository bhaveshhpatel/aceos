/**
 * Analytics provider abstraction.
 * Import and call this — never import PostHog/Mixpanel directly in app code.
 */
import { analyticsConfig } from '@/config/analytics.config';

type EventProperties = Record<string, string | number | boolean | null>;

export function trackEvent(event: string, properties?: EventProperties): void {
  if (typeof window === 'undefined') return;
  if (analyticsConfig.provider === 'none') return;

  if (analyticsConfig.provider === 'posthog') {
    // Dynamic import keeps PostHog out of the critical bundle
    import('posthog-js').then(({ default: posthog }) => {
      posthog.capture(event, properties);
    }).catch(() => {/* analytics failure must never break the app */});
  }
}

export function identifyUser(userId: string, traits?: EventProperties): void {
  if (typeof window === 'undefined') return;
  if (analyticsConfig.provider === 'none') return;

  if (analyticsConfig.provider === 'posthog') {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.identify(userId, traits);
    }).catch(() => {});
  }
}

export function resetUser(): void {
  if (typeof window === 'undefined') return;
  if (analyticsConfig.provider === 'none') return;

  if (analyticsConfig.provider === 'posthog') {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.reset();
    }).catch(() => {});
  }
}
