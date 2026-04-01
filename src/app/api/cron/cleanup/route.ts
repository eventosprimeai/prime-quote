import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 1. Encontrar todas las imágenes de referencia expiradas
    const expiredImages = await db.quoteImage.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (expiredImages.length === 0) {
      return NextResponse.json({ success: true, message: "No hay imágenes expiradas para limpiar." });
    }

    let deletedCount = 0;
    let failedCount = 0;

    // 2. Eliminar los archivos físicos del servidor y la base de datos
    for (const image of expiredImages) {
      try {
        // La URL suele ser '/uploads/userId/filename'
        const relativePath = image.url.replace(/^\//, ''); // Quita el slash inicial
        const absolutePath = path.join(process.cwd(), 'public', relativePath);
        
        try {
          await unlink(absolutePath);
        } catch (fsError: any) {
           // Si el archivo ya no existe, ignoramos el error para purgar la BD igualmente
           if (fsError.code !== 'ENOENT') {
              throw fsError;
           }
        }

        // Si se borró físicamente con éxito (o no existía), purgar de BD
        await db.quoteImage.delete({
          where: { id: image.id }
        });
        
        deletedCount++;
      } catch (err) {
        console.error(`Error deleting image ${image.id}:`, err);
        failedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Limpieza profunda finalizada",
      deletedFiles: deletedCount, 
      failed: failedCount 
    });

  } catch (error) {
    console.error('Error en cron de limpieza:', error);
    return NextResponse.json({ error: 'Error del servidor durante limpieza' }, { status: 500 });
  }
}
