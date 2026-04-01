import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth required
  const publicPaths = [
    '/',
    '/auth',
    '/auth/login',
    '/auth/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/init',
  ];

  // Public patterns
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/cotizacion/') ||
    (pathname.startsWith('/api/quotes/') && request.method === 'GET') ||
    pathname.match(/^\/api\/quotes\/[^\/]+\/chat$/) ||
    pathname.match(/^\/api\/quotes\/[^\/]+\/approve$/) ||
    pathname.match(/^\/api\/quotes\/[^\/]+\/contract\/extend$/) ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  // Check session cookie for admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
