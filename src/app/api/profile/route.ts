import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let profile = await db.businessProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await db.businessProfile.create({
        data: {
          userId: user.id,
          companyName: user.name,
          email: user.email,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      logoUrl,
      phone,
      email,
      website,
      address,
      taxId,
      paymentMethods,
      conditions,
    } = body;

    const profile = await db.businessProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyName,
        logoUrl,
        phone,
        email,
        website,
        address,
        taxId,
        paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : null,
        conditions,
      },
      update: {
        companyName,
        logoUrl,
        phone,
        email,
        website,
        address,
        taxId,
        paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : null,
        conditions,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
