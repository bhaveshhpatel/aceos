/**
 * Supabase Browser Client
 * For use in Client Components ('use client') only.
 * Creates a single instance per browser session.
 *
 * Never use this in Server Components or API routes — use lib/supabase/server.ts.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
