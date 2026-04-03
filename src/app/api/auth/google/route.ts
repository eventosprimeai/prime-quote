import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID no configurado' }, { status: 500 });
  }

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.append('client_id', clientId);
  oauthUrl.searchParams.append('redirect_uri', redirectUri);
  oauthUrl.searchParams.append('response_type', 'code');
  oauthUrl.searchParams.append('scope', 'openid email profile');
  oauthUrl.searchParams.append('access_type', 'offline');
  oauthUrl.searchParams.append('prompt', 'consent');

  return NextResponse.redirect(oauthUrl.toString());
}
