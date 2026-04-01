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
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' | 'reference' | 'profile-logo'
    const quoteId = formData.get('quoteId') as string | null;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, role: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // SAAS Limitation: Free tier cannot upload logos
    const isLogoUpload = type === 'logo' || type === 'profile-logo';
    if (isLogoUpload && dbUser.plan === 'FREE' && dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Para subir tu propio logo, actualiza a nuestro plan Starter ($9/mes).' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo excede 5MB' }, { status: 400 });
    }

    // Check image count for reference images
    if (type === 'reference' && quoteId) {
      const existingCount = await db.quoteImage.count({ where: { quoteId } });
      if (existingCount >= MAX_IMAGES_PER_QUOTE) {
        return NextResponse.json(
          { error: `Máximo ${MAX_IMAGES_PER_QUOTE} imágenes por cotización` },
          { status: 400 }
        );
      }
    }

    // Create upload directory
    const userDir = path.join(UPLOAD_DIR, user.id);
    await mkdir(userDir, { recursive: true });

    // Generate unique filename
    const ext = 'webp';
    const filename = `${randomBytes(12).toString('hex')}.${ext}`;
    const filepath = path.join(userDir, filename);

    // Process image with sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    
    if (type === 'logo' || type === 'profile-logo') {
      // Logo: preserve transparency, high quality, max 600px
      await sharp(buffer)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(filepath);
    } else {
      // Reference images: compress more, max 1200px
      await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);
    }

    const url = `/uploads/${user.id}/${filename}`;

    // Save to database for reference images
    if (type === 'reference' && quoteId) {
      const expiresAt = user.role === 'admin' 
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

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
