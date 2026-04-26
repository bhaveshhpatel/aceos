/**
 * AI Error → NextResponse mapper
 * TS2-04 — AI Error Handling, Fallback States, and User-Visible Error UX
 *
 * Use in every AI-calling API route catch block.
 * Never exposes internal error details, stack traces, or PII to the client.
 */

import { NextResponse } from 'next/server';
import { AIError, USER_FACING_ERRORS } from './errors';

function httpStatusForCode(code: string): number {
  switch (code) {
    case 'RATE_LIMITED':       return 429;
    case 'INPUT_TOO_LONG':     return 400;
    case 'INVALID_RESPONSE':   return 502;
    case 'CONTENT_FILTERED':   return 422;
    default:                   return 503; // PROVIDER_UNAVAILABLE, TIMEOUT, QUOTA_EXCEEDED, VALIDATION_UNAVAILABLE
  }
}

export function handleAIError(
  error: unknown,
  context: { student_id?: string; route?: string; question_id?: string }
): NextResponse {
  // Log full error internally — never forwarded to client
  console.error('[AI Error]', {
    error: error instanceof Error ? error.message : String(error),
    route: context.route,
    timestamp: new Date().toISOString(),
    // Deliberately NOT logging student_id or question_id to avoid PII in server logs
  });

  if (error instanceof AIError) {
    return NextResponse.json(
      {
        error: error.code,
        message: USER_FACING_ERRORS[error.code] ?? 'Something went wrong. Please try again.',
        retryable: error.retryable,
      },
      { status: httpStatusForCode(error.code) }
    );
  }

  return NextResponse.json(
    {
      error: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.',
      retryable: true,
    },
    { status: 500 }
  );
}
