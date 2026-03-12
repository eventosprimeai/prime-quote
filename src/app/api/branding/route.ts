import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const branding = await db.branding.findFirst();
    return NextResponse.json(branding);
  } catch (error) {
    console.error('Get branding error:', error);
    return NextResponse.json({ error: 'Error al obtener branding' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { logoUrl, companyName, primaryColor, accentColor } = body;

    let branding = await db.branding.findFirst();

    if (branding) {
      branding = await db.branding.update({
        where: { id: branding.id },
        data: {
          logoUrl,
          companyName,
          primaryColor,
          accentColor
        }
      });
    } else {
      branding = await db.branding.create({
        data: {
          logoUrl,
          companyName,
          primaryColor,
          accentColor
        }
      });
    }

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Update branding error:', error);
    return NextResponse.json({ error: 'Error al actualizar branding' }, { status: 500 });
  }
}
