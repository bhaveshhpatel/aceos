/**
 * payments.config.ts
 * Pluggable payments provider configuration.
 * Application code calls lib/providers/payments — never calls Stripe directly.
 *
 * Swap provider: change PAYMENTS_PROVIDER env var. No code changes needed.
 */
export const paymentsConfig = {
  provider: (process.env.PAYMENTS_PROVIDER ?? 'stripe') as 'stripe' | 'none',
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
    secretKey:      process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret:  process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },
} as const;
