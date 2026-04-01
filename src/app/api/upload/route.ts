import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import sharp from 'sharp';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES_PER_QUOTE = 10;
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' | 'reference' | 'profile-logo' | 'payment_capture'
    const quoteId = formData.get('quoteId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo excede 5MB' }, { status: 400 });
    }

    const user = await getSession();
    let targetUserId = user?.id;

    // For payment captures, allow unauthenticated clients and use the professional's ID
    if (type === 'payment_capture') {
       if (!quoteId) return NextResponse.json({ error: 'Falta quoteId' }, { status: 400 });
       const quote = await db.quote.findUnique({ where: { id: quoteId } });
       if (!quote) return NextResponse.json({ error: 'Quote no existe' }, { status: 404 });
       targetUserId = quote.userId;
    } else {
       if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
       
       const dbUser = await db.user.findUnique({
         where: { id: user.id },
         select: { plan: true, role: true }
       });

       if (!dbUser) {
         return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
       }

       const isLogoUpload = type === 'logo' || type === 'profile-logo';
       if (isLogoUpload && dbUser.plan === 'FREE' && dbUser.role !== 'admin') {
         return NextResponse.json(
           { error: 'Para subir tu propio logo, actualiza a nuestro plan Starter ($9/mes).' },
           { status: 403 }
         );
       }

       if (type === 'reference' && quoteId) {
         const existingCount = await db.quoteImage.count({ where: { quoteId } });
         if (existingCount >= MAX_IMAGES_PER_QUOTE) {
           return NextResponse.json(
             { error: `Máximo ${MAX_IMAGES_PER_QUOTE} imágenes por cotización` },
             { status: 400 }
           );
         }
       }
    }

    if (!targetUserId) {
       return NextResponse.json({ error: 'No se pudo resolver el directorio' }, { status: 500 });
    }

    if (type === 'payment_capture' && !quoteId) {
       return NextResponse.json({ error: 'Falta quoteId para el comprobante de pago' }, { status: 400 });
    }

    // Create upload directory
    const userDir = path.join(UPLOAD_DIR, targetUserId);
    await mkdir(userDir, { recursive: true });

    // Generate unique filename
    const ext = 'webp';
    const filename = `${randomBytes(12).toString('hex')}.${ext}`;
    const filepath = path.join(userDir, filename);

    // Process image with sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    
    if (type === 'logo' || type === 'profile-logo') {
      await sharp(buffer)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(filepath);
    } else if (type === 'payment_capture') {
      await sharp(buffer)
        .resize(1080, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toFile(filepath);
    } else {
      await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);
    }

    const url = `/uploads/${targetUserId}/${filename}`;

    // Save to database for reference images
    if (type === 'reference' && quoteId) {
      const expiresAt = user?.role === 'admin' 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.quoteImage.create({
        data: {
          quoteId,
          url,
          filename,
          size: file.size,
          expiresAt,
        },
      });
    }

    // Save as QuoteMessage if it's a payment capture
    if (type === 'payment_capture' && quoteId) {
        // @ts-ignore
        await db.quoteMessage.create({
           data: {
              quoteId,
              sender: "CLIENT", 
              type: "PAYMENT_CAPTURE",
              text: "Captura de pago enviada",
              imageUrl: url,
           }
        });
    }

    return NextResponse.json({ url, filename });
  } catch (error: any) {
    console.error('Upload error:', error);
    try { await writeFile('error-log.txt', String(error?.stack || error)); } catch(e){}
    return NextResponse.json({ error: 'Error al subir imagen', details: error?.message || String(error) }, { status: 500 });
  }
}
