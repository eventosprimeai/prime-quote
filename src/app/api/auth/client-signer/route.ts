import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Returns the current client_signer cookie info (if any) for a given quoteToken
export async function GET(request: NextRequest) {
  const quoteToken = request.nextUrl.searchParams.get('token');
  const cookieStore = await cookies();
  const signerCookie = cookieStore.get('client_signer');
  const allCookieNames = cookieStore.getAll().map(c => c.name);

  console.log('[CLIENT_SIGNER_CHECK] quoteToken:', quoteToken);
  console.log('[CLIENT_SIGNER_CHECK] All cookies:', allCookieNames);
  console.log('[CLIENT_SIGNER_CHECK] client_signer cookie:', signerCookie?.value ? 'EXISTS' : 'MISSING');

  if (!signerCookie?.value || !quoteToken) {
    console.log('[CLIENT_SIGNER_CHECK] → Returning verified: false (missing cookie or token)');
    return NextResponse.json({ verified: false });
  }

  try {
    const parsed = JSON.parse(signerCookie.value);
    console.log('[CLIENT_SIGNER_CHECK] Parsed cookie quoteToken:', parsed.quoteToken, 'vs requested:', quoteToken);
    if (parsed.quoteToken !== quoteToken) {
      console.log('[CLIENT_SIGNER_CHECK] → Token mismatch! Returning verified: false');
      return NextResponse.json({ verified: false });
    }
    console.log('[CLIENT_SIGNER_CHECK] → SUCCESS! Returning verified: true for', parsed.email);
    return NextResponse.json({
      verified: true,
      email: parsed.email,
      name: parsed.name,
    });
  } catch {
    console.log('[CLIENT_SIGNER_CHECK] → JSON parse error! Returning verified: false');
    return NextResponse.json({ verified: false });
  }
}
