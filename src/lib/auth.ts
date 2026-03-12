import { db } from './db';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return null;
    }
    
    // Find session in database
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!session) {
      return null;
    }
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { token } });
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('getSession error:', error);
    return null;
  }
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  // Delete old sessions for this user
  await db.session.deleteMany({
    where: { userId }
  });
  
  // Create new session
  await db.session.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
  
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: false, // Always false for development
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (token) {
    await db.session.delete({ where: { token } }).catch(() => {});
  }
  
  cookieStore.delete('session');
}
