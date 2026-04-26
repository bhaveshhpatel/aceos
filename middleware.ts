/**
 * Next.js middleware — session refresh + route protection.
 *
 * Protected routes: /dashboard, /practice, /frq, /onboarding
 * Public routes:    /signin, /signup, /verify-email, /forgot-password, /auth/callback
 *
 * Uses @supabase/ssr to refresh the session token on every request.
 * This is required — without it, Server Components see stale sessions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/dashboard', '/practice', '/frq', '/onboarding', '/profile'];
const PUBLIC_PATHS = ['/signin', '/signup', '/verify-email', '/forgot-password', '/auth'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — MUST be called before checking auth state
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(p => path.startsWith(p));
  const isPublic    = PUBLIC_PATHS.some(p => path.startsWith(p));

  // Unauthenticated user hitting a protected route
  if (isProtected && !user) {
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated user hitting auth pages — send to dashboard
  if (isPublic && user && !path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
