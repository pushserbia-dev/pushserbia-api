import { generateGravatar } from './generate-gravatar';
import { createHash } from 'crypto';

describe('generateGravatar', () => {
  it('should generate correct MD5 hash for normalized email', () => {
    const email = 'Test@Example.COM';
    const expected = createHash('md5')
      .update('test@example.com')
      .digest('hex');
    expect(generateGravatar(email)).toBe(expected);
  });

  it('should return null for null email', () => {
    expect(generateGravatar(null)).toBeNull();
  });

  it('should return null for undefined email', () => {
    expect(generateGravatar(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(generateGravatar('')).toBeNull();
  });

  it('should produce a 32-character hex string', () => {
    const result = generateGravatar('user@example.com');
    expect(result).toHaveLength(32);
    expect(result).toMatch(/^[a-f0-9]{32}$/);
  });
});
