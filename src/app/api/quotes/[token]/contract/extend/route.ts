import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { text, action } = body;

    const quote = await db.quote.findUnique({
      where: { token },
      include: { contract: true }
    });

    if (!quote || !quote.contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    const user = await getSession();
    
    if (action === 'REQUEST_MODIFICATION') {
      if (!user) {
        return NextResponse.json({ error: 'Debes iniciar sesión para solicitar extensión' }, { status: 401 });
      }
      
      // @ts-ignore
      await db.quoteMessage.create({
        data: {
           quoteId: quote.id,
           sender: "CLIENT",
           type: "MODIFICATION_REQUEST",
           text: text
        }
      });
      return NextResponse.json({ success: true, message: "Solicitud enviada al profesional." });
    }

    if (action === 'DIRECT_EXTENSION') {
      if (!user || user.id !== quote.userId) {
        return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
      }

      const existingExtensions = quote.contract.metadata ? JSON.parse(quote.contract.metadata as string) : [];
      existingExtensions.push({
         date: new Date().toISOString(),
         text: text,
      });

      // @ts-ignore
      await db.contract.update({
         where: { id: quote.contract.id },
         data: { metadata: JSON.stringify(existingExtensions) }
      });

      return NextResponse.json({ success: true, message: "Extensión añadida oficialmente." });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Extension error:', error);
    return NextResponse.json({ error: 'Error interno de servidor', details: error.message || String(error) }, { status: 500 });
  }
}
