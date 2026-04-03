import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateRaw = searchParams.get('state');

    if (error || !code) {
      console.error('Google Auth Error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=google_auth_failed', request.url));
    }

    // Decode state to detect client_sign mode
    let stateData: { mode?: string; quoteToken?: string } = {};
    if (stateRaw) {
      try { stateData = JSON.parse(Buffer.from(stateRaw, 'base64').toString()); } catch {}
    }
    const isClientSign = stateData.mode === 'client_sign' && !!stateData.quoteToken;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth Credentials');
      return NextResponse.redirect(new URL('/auth/login?error=config_missing', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Failed to get token:', tokenData);
      return NextResponse.redirect(new URL('/auth/login?error=token_failed', request.url));
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok || !userData.email) {
      console.error('Failed to fetch user data:', userData);
      return NextResponse.redirect(new URL('/auth/login?error=profile_failed', request.url));
    }

    const email = userData.email.toLowerCase();

    // ─── CLIENT SIGN MODE ─────────────────────────────────────────
    if (isClientSign) {
      const quoteToken = stateData.quoteToken!;

      // Verify this email is NOT the quote owner
      const quote = await db.quote.findUnique({
        where: { token: quoteToken },
        include: { user: true }
      });

      if (!quote) {
        const errUrl = new URL(`/cotizacion/${quoteToken}`, request.url);
        errUrl.searchParams.set('sign_error', 'quote_not_found');
        return NextResponse.redirect(errUrl);
      }

      if (quote.user.email.toLowerCase() === email) {
        const errUrl = new URL(`/cotizacion/${quoteToken}`, request.url);
        errUrl.searchParams.set('sign_error', 'owner_cannot_sign');
        return NextResponse.redirect(errUrl);
      }

      // Set client_signer cookie on the redirect response
      const signerPayload = JSON.stringify({ email, name: userData.name || '', quoteToken });
      console.log('[CLIENT_SIGN] Setting cookie for:', email, 'quoteToken:', quoteToken);
      console.log('[CLIENT_SIGN] Payload:', signerPayload);
      
      const redirectBack = new URL(`/cotizacion/${quoteToken}`, request.url);
      redirectBack.searchParams.set('client_verified', '1');
      
      const res = NextResponse.redirect(redirectBack);
      res.cookies.set('client_signer', signerPayload, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 30,
        path: '/',
      });
      
      console.log('[CLIENT_SIGN] Response headers:', Object.fromEntries(res.headers.entries()));
      return res;
    }
    // ─────────────────────────────────────────────────────────────

    // Normal admin login flow
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = randomBytes(16).toString('hex');
      user = await db.user.create({
        data: {
          email,
          name: userData.name || userData.given_name || 'Usuario',
          password: randomPassword,
          plan: 'FREE',
          role: 'user',
        },
      });
      await db.businessProfile.create({
        data: { userId: user.id, companyName: userData.name || 'Mi Empresa' }
      });
    }

    await createSession(user.id);
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));

  } catch (err) {
    console.error('Google Callback Error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=internal_error', request.url));
  }
}
