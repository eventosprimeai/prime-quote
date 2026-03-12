import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    // Check if admin exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'admin' }
    });

    if (!existingAdmin) {
      // Create default admin with Gabriel's credentials
      const hashedPassword = await hashPassword('Prime2025');
      await db.user.create({
        data: {
          email: 'gabriel@eventosprime.com',
          name: 'Gabriel',
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('Admin user created: gabriel@eventosprime.com / Prime2025');
    }

    // Check if branding exists
    const existingBranding = await db.branding.findFirst();
    if (!existingBranding) {
      await db.branding.create({
        data: {
          companyName: 'Eventos Prime Tecnología',
          primaryColor: '#1a1a2e',
          accentColor: '#0f3460'
        }
      });
    }

    // Check if template exists
    const existingTemplate = await db.template.findFirst();
    if (!existingTemplate) {
      // Create default template with sections
      const template = await db.template.create({
        data: {
          name: 'Desarrollo Web Corporativo',
          description: 'Plantilla para proyectos de desarrollo web corporativo',
          isActive: true
        }
      });

      // Create template sections
      const sections = [
        {
          key: 'introduction',
          title: 'Introducción del Proyecto',
          icon: 'FileText',
          order: 1,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'text',
            text: 'El proyecto contempla la creación de un sitio web corporativo moderno, escalable y optimizado.'
          })
        },
        {
          key: 'technologies',
          title: 'Tecnologías Propuestas',
          icon: 'Code',
          order: 2,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'list',
            items: [
              { title: 'Frontend', subtitle: 'Next.js, TypeScript, Tailwind CSS, Framer Motion' },
              { title: 'Backend', subtitle: 'API Routes, Formularios conectados a servicios' },
              { title: 'Infraestructura', subtitle: 'Vercel/Cloud Hosting, CDN global, SSL, SEO' },
              { title: 'Herramientas', subtitle: 'Google Analytics, Tag Manager, Core Web Vitals' }
            ]
          })
        },
        {
          key: 'architecture',
          title: 'Arquitectura del Sitio Web',
          icon: 'Layers',
          order: 3,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'list',
            items: [
              { title: 'Inicio (Home)', items: ['Hero principal', 'Propuesta de valor', 'Beneficios', 'CTA'] },
              { title: 'Nosotros', items: ['Historia', 'Misión', 'Visión', 'Valores'] },
              { title: 'Servicios', items: ['Descripción', 'Beneficios', 'Formulario'] },
              { title: 'Contacto', items: ['Información', 'Formulario', 'Mapa'] }
            ]
          })
        },
        {
          key: 'infrastructure',
          title: 'Infraestructura y Hosting',
          icon: 'Server',
          order: 4,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'text',
            text: 'Para garantizar estabilidad, seguridad y escalabilidad, el sitio web será implementado en un servidor VPS dedicado.',
            items: [
              { title: 'Servidor Recomendado', subtitle: 'Hostinger VPS KVM 4 - 4 vCPU, 16 GB RAM, 200 GB NVMe' }
            ],
            link: {
              text: 'Ver paquete de hosting',
              url: 'https://www.hostinger.com/cart?product=vps%3Avps_kvm_4&period=12&referral_type=cart_link&REFERRALCODE=N5SEVENTON1T&referral_id=019cdfb1-d3f6-7041-b023-99f027234153'
            }
          })
        },
        {
          key: 'timeline',
          title: 'Tiempo de Desarrollo',
          icon: 'Clock',
          order: 5,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'timeline',
            items: [
              { title: 'Día 1', description: 'Inicio del desarrollo e implementación de estructura' },
              { title: 'Días 2-5', description: 'Desarrollo de todas las secciones y páginas' },
              { title: 'Día 6', description: 'Pruebas internas y optimización' },
              { title: 'Día 7', description: 'Entrega de primera versión para revisión' }
            ]
          })
        },
        {
          key: 'client-info',
          title: 'Información Requerida del Cliente',
          icon: 'ClipboardList',
          order: 6,
          isRequired: false,
          isDefault: true,
          content: JSON.stringify({
            type: 'list',
            items: [
              { title: 'Información Institucional', items: ['Historia', 'Misión', 'Visión', 'Valores'] },
              { title: 'Contenido de Servicios', items: ['Descripciones', 'Beneficios', 'Metodología'] },
              { title: 'Recursos Gráficos', items: ['Logotipo', 'Fotografías', 'Material corporativo'] },
              { title: 'Información de Contacto', items: ['Teléfonos', 'Correos', 'Dirección'] }
            ]
          })
        },
        {
          key: 'features',
          title: 'Funcionalidades Incluidas',
          icon: 'CheckCircle',
          order: 7,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'list',
            items: [
              { title: 'Diseño moderno y profesional' },
              { title: 'Responsive (adaptado a móviles)' },
              { title: 'Optimización SEO inicial' },
              { title: 'Formularios de contacto' },
              { title: 'Integración analítica web' },
              { title: 'Seguridad SSL' },
              { title: 'Panel básico de administración' }
            ]
          })
        },
        {
          key: 'deliverables',
          title: 'Entregables',
          icon: 'Package',
          order: 8,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'list',
            items: [
              { title: 'Sitio web funcional' },
              { title: 'Código fuente' },
              { title: 'Documentación básica' },
              { title: 'Capacitación básica de uso' }
            ]
          })
        },
        {
          key: 'revisions',
          title: 'Revisión y Ajustes',
          icon: 'RefreshCw',
          order: 9,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'text',
            text: 'Una vez entregada la primera versión, el cliente realizará una revisión completa y enviará una lista detallada de ajustes. Los ajustes serán implementados y entregados al día siguiente.',
            items: [
              { title: 'Ajuste Adicional de Cortesía', description: '15 días después de la entrega, el cliente podrá solicitar ajustes de textos y cambios informativos.' }
            ]
          })
        },
        {
          key: 'payment',
          title: 'Condiciones de Pago',
          icon: 'CreditCard',
          order: 10,
          isRequired: true,
          isDefault: true,
          content: JSON.stringify({
            type: 'list',
            items: [
              { title: 'Primer pago', subtitle: '50% del valor del proyecto para iniciar el desarrollo' },
              { title: 'Pago final', subtitle: '50% restante el mismo día de la entrega final' }
            ]
          })
        }
      ];

      for (const section of sections) {
        await db.templateSection.create({
          data: {
            templateId: template.id,
            ...section
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'System initialized' });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: 'Initialization failed' }, { status: 500 });
  }
}
