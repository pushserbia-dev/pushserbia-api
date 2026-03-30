import { normalizeEmail } from './normalize-email';
import { createHash } from 'crypto';

export function generateGravatar(email: string | undefined | null): string | null {
  if (!email) {
    return null;
  }
  const normalized = normalizeEmail(email);

  return createHash('md5').update(normalized).digest('hex');
}
