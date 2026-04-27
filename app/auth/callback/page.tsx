'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Client-side handler for Supabase implicit-flow email verification.
 *
 * After clicking the verification link in their email, Supabase redirects
 * to /auth/callback with the session tokens in the URL hash fragment:
 *   #access_token=...&refresh_token=...&type=signup
 *
 * Hash fragments are never sent to the server, so route.ts never sees them.
 * This page runs on the client, reads the hash, calls setSession(), then
 * redirects to the correct onboarding step based on account_status.
 *
 * The server-side route.ts at the same path handles the PKCE ?code= flow
 * (OAuth). Next.js will serve this page.tsx for GET requests that arrive
 * without a ?code= param and have no server-rendered body — the two
 * handlers do not conflict.
 *
 * Routing after session is set:
 *   Redirect to /auth/verify-session which is a lightweight server route
 *   that reads the now-established cookie session and applies the T1.4
 *   state machine routing (same logic as route.ts post-exchange).
 *   This avoids duplicating routing logic in client code.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const hash   = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const errorParam   = params.get('error');
    const errorDesc    = params.get('error_description');

    // Provider returned an error (e.g. expired link)
    if (errorParam) {
      router.replace(`/signin?error=${encodeURIComponent(errorDesc ?? errorParam)}`);
      return;
    }

    // No hash tokens — stale load or already handled by route.ts
    if (!accessToken || !refreshToken) {
      router.replace('/signin?error=missing_token');
      return;
    }

    // Establish the session from the implicit-flow tokens
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error || !data.session) {
          router.replace(`/signin?error=${encodeURIComponent(error?.message ?? 'session_failed')}`);
          return;
        }

        // Session cookie is now set. Hand off to the server verify route
        // which reads the session and applies the T1.4 state-machine routing.
        router.replace('/auth/verify-session');
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Verifying your email…</p>
    </div>
  );
}
