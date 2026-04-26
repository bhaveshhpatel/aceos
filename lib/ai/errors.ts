/**
 * AI Error Types and User-Facing Messages
 * TS2-04 — AI Error Handling, Fallback States, and User-Visible Error UX
 */

export type AIErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'CONTENT_FILTERED'
  | 'QUOTA_EXCEEDED'
  | 'VALIDATION_UNAVAILABLE'
  | 'INPUT_TOO_LONG';

export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    public provider: string,
    public route: string,
    public retryable: boolean,
    message: string
  ) {
    super(message);
    this.name = 'AIError';
    // Restore prototype chain for instanceof checks across transpile targets
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Safe, student-facing messages. Never expose raw errors or internal details. */
export const USER_FACING_ERRORS: Record<AIErrorCode, string> = {
  PROVIDER_UNAVAILABLE:
    'Our AI is temporarily unavailable. Your answer has been saved — please try again in a few minutes.',
  RATE_LIMITED:
    'We are receiving high demand right now. Your answer has been saved — please try again in 60 seconds.',
  TIMEOUT:
    'This is taking longer than expected. Your answer has been saved — please try again.',
  INVALID_RESPONSE:
    'Something went wrong with grading. Your response has been saved. Our team has been notified.',
  CONTENT_FILTERED:
    'We could not process this response. Please review your answer and try again.',
  QUOTA_EXCEEDED:
    'Our AI service is temporarily at capacity. Please try again later.',
  VALIDATION_UNAVAILABLE:
    'We could not verify your answer right now. Your response has been saved.',
  INPUT_TOO_LONG:
    'Your response is too long to process. Please shorten it and try again.',
};
