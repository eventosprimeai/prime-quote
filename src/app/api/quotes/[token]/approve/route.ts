import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { signature } = await request.json();

    const quote = await db.quote.findUnique({
      where: { token: params.token },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (quote.status === 'accepted') {
       return NextResponse.json({ error: 'La cotización ya ha sido aprobada' }, { status: 400 });
    }

    // Mark as accepted
    const updatedQuote = await db.quote.update({
      where: { id: quote.id },
      data: { status: 'accepted' }
    });

    // Auto-generate Contract record
    const contract = await db.contract.create({
      data: {
        quoteId: quote.id,
        content: JSON.stringify({
           legalTerms: "Términos y condiciones aceptados digitalmente por el cliente.",
           agreedPrice: quote.projectPrice,
           projectName: quote.projectName,
           companyName: quote.companyName,
        }),
        signature: signature || "Aprobación Electrónica",
        signedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, quote: updatedQuote, contract });
  } catch (error) {
    console.error('Error approving quote:', error);
    return NextResponse.json({ error: 'Error al aprobar la cotización' }, { status: 500 });
  }
}
