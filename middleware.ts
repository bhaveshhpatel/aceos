/**
 * Next.js Middleware
 * Runs on every request before page render.
 *
 * Responsibilities:
 *   1. Refresh Supabase session (keeps cookies fresh)
 *   2. Protect authenticated routes — redirect to /signin if no session
 *   3. Redirect authenticated users away from auth pages
 *
 * Route structure:
 *   Public:          /signin  /signup  /verify-email  /forgot-password  /auth/*  /legal/*
 *   Public API:      /api/auth/*  (signup, signin, OAuth — no session required)
 *   Onboarding:      /onboarding/[product]/*  (auth required, no onboarding check here)
 *   Protected:       /[product]/dashboard  /[product]/*
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/legal',
  '/pricing',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Allow public paths through always
  if (isPublicPath(pathname)) {
    // Redirect signed-in users away from auth pages
    if (user && (pathname === '/signin' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/score-boost-ap/dashboard', request.url));
    }
    return response;
  }

  // No session — redirect to sign in, preserving intended destination
  if (!user) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
