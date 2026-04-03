import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      console.error('Google Auth Error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=google_auth_failed', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth Credentials');
      return NextResponse.redirect(new URL('/auth/login?error=config_missing', request.url));
    }

    // Intercambiar el código por el token de acceso
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

    // Obtener información del usuario con el access token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok || !userData.email) {
      console.error('Failed to fetch user data:', userData);
      return NextResponse.redirect(new URL('/auth/login?error=profile_failed', request.url));
    }

    // Buscar si el usuario ya existe en Supabase DB
    const email = userData.email.toLowerCase();
    let user = await db.user.findUnique({
      where: { email },
    });

    // Si no existe, lo creamos
    if (!user) {
      // Necesitamos generar una contraseña aleatoria ya que no la proporcionaron
      const randomPassword = randomBytes(16).toString('hex');
      // No hacemos hash aquí pues es dummy login de OAuth, pero mantenemos compatibilidad por si deciden separarlo
      
      user = await db.user.create({
        data: {
          email,
          name: userData.name || userData.given_name || 'Usuario',
          password: randomPassword, // Ignorado en login oauth pero requerido en el schema
          plan: 'FREE',
          role: 'user',
        },
      });
      
      // Creamos el BusinessProfile vacío por si acaso
      await db.businessProfile.create({
        data: {
          userId: user.id,
          companyName: userData.name || 'Mi Empresa',
        }
      });
    }

    // Crear sesión en PWA/Web
    await createSession(user.id);

    // Redirigir al dashboard con pase verde
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));

  } catch (err) {
    console.error('Google Callback Error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=internal_error', request.url));
  }
}
