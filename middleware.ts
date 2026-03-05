import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Auth middleware — runs on every request before the page renders.
 * Protects the entire /(app) route group server-side so that unauthenticated
 * users cannot access app pages even if client-side JS is disabled or
 * the AuthGuard component is bypassed.
 *
 * Public routes (auth pages, confirmation, root redirect) are explicitly
 * allowed through without a session check.
 */

const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/confirm'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public auth routes through without checking session
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // If Supabase is not configured yet (local dev before setup), skip server-side
  // auth and fall through to the client-side AuthGuard.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  // Guest mode: client sets a short-lived cookie when user clicks "Continue as guest".
  // The middleware respects it to avoid an infinite redirect loop.
  if (request.cookies.get('menu-guest')?.value === '1') {
    return NextResponse.next();
  }

  // Build a response to forward cookies through
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session and validates the JWT on every request.
  // getUser() is preferred over getSession() here because it makes a
  // round-trip to Supabase Auth to validate the token, rather than
  // relying on the potentially stale local session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated — redirect to sign-in, preserving the intended URL
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    // Only append redirectTo for non-root paths to avoid redirect loops
    if (pathname !== '/') {
      url.searchParams.set('redirectTo', pathname);
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - /icons/*      (PWA icons)
     * - /manifest.json
     * - *.svg / *.png / *.jpg / *.webp / *.ico
     * These are excluded via the negative lookahead below.
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)',
  ],
};
