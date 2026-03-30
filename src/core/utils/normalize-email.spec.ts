import { normalizeEmail } from './normalize-email';

describe('normalizeEmail', () => {
  it('should lowercase and trim email', () => {
    expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });

  it('should handle already normalized email', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
  });

  it('should handle empty string', () => {
    expect(normalizeEmail('')).toBe('');
  });
});
