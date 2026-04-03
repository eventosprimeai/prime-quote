import { NextResponse } from 'next/server';

/**
 * GET /api/billing/plans
 * Returns available plans and pricing.
 */
export async function GET() {
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      features: ['10 Cotizaciones/mes', 'Mensajes limitados'],
      isPopular: false,
    },
    {
      id: 'STARTER',
      name: 'Starter',
      price: 9,
      features: ['50 Cotizaciones/mes', 'Sin marca de agua', 'Firma digital'],
      isPopular: false,
      googlePlayIdMonthly: 'pq_starter_monthly',
      googlePlayIdAnnual: 'pq_starter_annual',
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 29,
      features: ['Ilimitadas', 'Exportar PDF', 'Marca Blanca', 'API'],
      isPopular: true,
      googlePlayIdMonthly: 'pq_pro_monthly',
      googlePlayIdAnnual: 'pq_pro_annual',
    },
    {
      id: 'SUITE',
      name: 'Suite',
      price: 89,
      features: ['Acceso 21 Apps', 'Agente AI propio', 'Soporte 24/7 VIP'],
      isPopular: false,
      googlePlayIdMonthly: 'pq_suite_monthly',
      googlePlayIdAnnual: 'pq_suite_annual',
    },
  ];

  return NextResponse.json(plans);
}
