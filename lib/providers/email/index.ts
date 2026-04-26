/**
 * Email provider abstraction.
 * Import and call this — never import Resend/SendGrid directly in app code.
 * Only runs server-side (API routes, Server Actions, Edge Functions).
 */
import { emailConfig } from '@/config/email.config';

export interface SendEmailOptions {
  to:      string | string[];
  subject: string;
  html:    string;
  text?:   string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (emailConfig.provider === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(emailConfig.resend.apiKey);

      const { error } = await resend.emails.send({
        from:     `${emailConfig.fromName} <${emailConfig.fromAddress}>`,
        to:       Array.isArray(options.to) ? options.to : [options.to],
        subject:  options.subject,
        html:     options.html,
        text:     options.text,
        reply_to: options.replyTo,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    return { success: false, error: `Email provider '${emailConfig.provider}' not implemented` };
  } catch (err) {
    console.error('[sendEmail]', err);
    return { success: false, error: 'Email delivery failed' };
  }
}
