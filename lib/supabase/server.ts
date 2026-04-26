/**
 * Supabase Server Client
 * SSR-compatible client for use in Next.js Server Components,
 * API routes, and middleware.
 *
 * Uses @supabase/ssr — reads/writes cookies for session management.
 * Never import this in client components — use lib/supabase/client.ts instead.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
