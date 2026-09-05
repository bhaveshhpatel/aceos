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

  // Optimization: Early return for public paths to avoid blocking Supabase Auth API network calls
  // Prevents Vercel 504 MIDDLEWARE_INVOCATION_TIMEOUT on public pages & static assets
  if (isPublicPath(pathname)) {
    if (pathname === '/signin' || pathname === '/signup') {
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
              response.cookies.set({ name, value, ...options });
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return response;
  }

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
          response.cookies.set({ name, value, ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

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
