/**
 * Supabase Server Client
 * SSR-compatible client for use in Next.js Server Components,
 * API routes, and middleware.
 *
 * Uses @supabase/ssr — reads/writes cookies for session management.
 * Never import this in client components — use lib/supabase/client.ts instead.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Middleware handles session refresh.
          }
        },
      },
    }
  );
}
