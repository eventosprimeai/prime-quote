import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/versions
 * Get all app versions (changelog)
 */
export async function GET() {
  try {
    const versions = await db.appVersion.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(versions);
  } catch (error) {
    console.error('[Versions API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/versions
 * Create a new version entry and optionally send a push notification
 */
export async function POST(request: NextRequest) {
  try {
     // Admin check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes(process.env.API_SECRET_KEY || 'ep_sk_prime_hub_2026')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { version, title, description, notify } = await request.json();

    if (!version || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create version
    const newVersion = await db.appVersion.create({
      data: {
        version,
        title,
        description,
        isActive: true,
      },
    });

    // Send push notification if requested
    if (notify) {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      const baseUrl = `${protocol}://${host}`;

      await fetch(`${baseUrl}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'ep_sk_prime_hub_2026'}`
        },
        body: JSON.stringify({
          title: `Prime Quote Actualizado a ${version}`,
          body: title,
          url: '/admin/actualizaciones',
        })
      });
    }

    return NextResponse.json(newVersion);
  } catch (error) {
    console.error('[Versions API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
