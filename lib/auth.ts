import crypto from 'crypto';

export function verifyAdmin(auth: string | null): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  if (!auth || !process.env.ADMIN_PASSWORD) {
    return false;
  }

  try {
    const authHash = crypto.createHash('sha256').update(auth).digest();
    const passwordHash = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();

    return crypto.timingSafeEqual(authHash, passwordHash);
  } catch (error) {
    return false;
  }
}
