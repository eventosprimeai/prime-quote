import { db } from './db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function cleanupExpiredImages() {
  try {
    const expired = await db.quoteImage.findMany({
      where: {
        expiresAt: {
          not: null,
          lte: new Date(),
        },
      },
    });

    for (const image of expired) {
      try {
        const filepath = path.join(process.cwd(), 'public', image.url);
        await unlink(filepath).catch(() => {});
        await db.quoteImage.delete({ where: { id: image.id } });
      } catch (err) {
        console.error(`Failed to cleanup image ${image.id}:`, err);
      }
    }

    if (expired.length > 0) {
      console.log(`[Cleanup] Removed ${expired.length} expired images`);
    }
  } catch (error) {
    console.error('[Cleanup] Error:', error);
  }
}

// Auto-run cleanup every 24 hours
let cleanupInterval: NodeJS.Timeout | null = null;

export function startImageCleanup() {
  if (cleanupInterval) return;
  
  // Run immediately on startup
  cleanupExpiredImages();
  
  // Then every 24 hours
  cleanupInterval = setInterval(cleanupExpiredImages, 24 * 60 * 60 * 1000);
}
