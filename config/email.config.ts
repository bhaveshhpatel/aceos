/**
 * email.config.ts
 * Pluggable email provider configuration.
 * Application code calls lib/providers/email — never calls Resend/SendGrid directly.
 *
 * Swap provider: change EMAIL_PROVIDER env var. No code changes needed.
 */
export const emailConfig = {
  provider: (process.env.EMAIL_PROVIDER ?? 'resend') as 'resend' | 'sendgrid' | 'postmark',
  fromAddress: process.env.EMAIL_FROM ?? 'noreply@aceos.app',
  fromName:    process.env.EMAIL_FROM_NAME ?? 'AceOS',
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
  },
} as const;
