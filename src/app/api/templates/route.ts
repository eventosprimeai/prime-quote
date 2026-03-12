import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const templates = await db.template.findMany({
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Error al obtener plantillas' }, { status: 500 });
  }
}
