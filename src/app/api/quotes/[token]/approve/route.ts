import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { signature } = await request.json();

    const quote = await db.quote.findUnique({
      where: { token },
      include: {
        sections: { include: { templateSection: true } },
        customSections: true,
        user: { include: { profile: true } }
      }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (quote.status === 'accepted') {
       return NextResponse.json({ error: 'La cotización ya ha sido aprobada' }, { status: 400 });
    }

    // Assemble contract body
    const elements: string[] = [];
    elements.push(`El presente contrato de prestación de servicios es celebrado por una parte entre "${quote.user.profile?.companyName || quote.user.name}" (en adelante "El Profesional") y por la otra parte "${quote.companyName}" (en adelante "El Cliente").`);
    elements.push(`Ambas partes acuerdan la ejecución de las siguientes acciones y servicios de acuerdo a la propuesta técnico-comercial detallada a continuación:`);

    [...quote.sections].filter(s => s.isVisible).forEach(s => {
       try {
          const c = s.content ? JSON.parse(s.content) : {}; 
          elements.push(`${s.title.toUpperCase()}: ${c.text || c.description || c.intro || "Detalle especificado en propuesta técnica."}`);
       } catch {
          elements.push(`${s.title.toUpperCase()}: ${s.content}`);
       }
    });

    quote.customSections.forEach(s => {
       try {
          const c = s.content ? JSON.parse(s.content) : {}; 
          elements.push(`${s.title.toUpperCase()}: ${c.text || c.description || c.intro || "Condición personalizada adjunta."}`);
       } catch {
          elements.push(`${s.title.toUpperCase()}: ${s.content}`);
       }
    });

    elements.push(`CLÁUSULAS ESPECIALES:\nAmbos comparecientes declaran su absoluta conformidad con lo estipulado en este documento extendido. Toda solicitud de modificación o extensión sobre los servicios descritos deberá ser solicitada electrónicamente en la presente plataforma.`);
    elements.push(`Al presionar el botón de firma, el Cliente autoriza el inicio inmediato de las actividades, y aprueba digitalmente este acuerdo formalizando la cotización en un compromiso vinculante de servicios profesionales.`);

    // Mark as accepted
    const updatedQuote = await db.quote.update({
      where: { id: quote.id },
      data: { status: 'accepted' }
    });

    // Lock all optional selections
    await db.quoteOptionalSelection.updateMany({
      where: { quoteId: quote.id },
      data: { lockedAt: new Date() }
    });

    // Auto-generate Contract record
    const contract = await db.contract.create({
      data: {
        quoteId: quote.id,
        content: JSON.stringify({
           legalTerms: elements.join("\n\n"),
           agreedPrice: quote.projectPrice,
           projectName: quote.projectName,
           companyName: quote.companyName,
        }),
        signature: signature || "Aprobación Electrónica Segura",
        signedAt: new Date()
      }
    });

    // Emitir evento crítico al API Hub (WF-01: Quote Approved → PrimeFlow → Planner/Finanzas/Ranking)
    const apiHubUrl = process.env.PRIME_API_HUB_URL || 'http://localhost:3006';
    fetch(`${apiHubUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'ep_sk_prime_hub_2026'}`,
      },
      body: JSON.stringify({
        event: 'quote.quote.approved',
        app: 'primequote',
        user_id: quote.user.id,
        data: {
          quote_id: quote.id,
          token: quote.token,
          company_name: quote.companyName,
          project_name: quote.projectName,
          project_price: quote.projectPrice,
          currency: quote.currency,
          contract_id: contract.id,
          signed_at: contract.signedAt,
          organizer_id: quote.user.id,
          organizer_company: quote.user.profile?.companyName,
        },
      }),
    }).catch(() => { /* Silencioso si el API Hub no está disponible */ });

    return NextResponse.json({ success: true, quote: updatedQuote, contract });
  } catch (error: any) {
    console.error('Error approving quote:', error);
    return NextResponse.json({ error: 'Error al aprobar la cotización', details: error.stack || String(error) }, { status: 500 });
  }
}
