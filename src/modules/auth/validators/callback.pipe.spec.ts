import { CallbackPipe } from './callback.pipe';
import { AuthService } from '../services/auth.service';

describe('CallbackPipe', () => {
  let pipe: CallbackPipe;
  let authService: Partial<AuthService>;

  beforeEach(() => {
    authService = {
      getConfig: jest.fn().mockReturnValue({
        callbackUrls: [
          'http://localhost:3000',
          'https://pushserbia.com',
        ],
      }),
    };
    pipe = new CallbackPipe(authService as AuthService);
  });

  it('should return the callback URL if it is in the allowed list', () => {
    expect(pipe.transform('http://localhost:3000')).toBe(
      'http://localhost:3000',
    );
  });

  it('should return the callback URL for production URL', () => {
    expect(pipe.transform('https://pushserbia.com')).toBe(
      'https://pushserbia.com',
    );
  });

  it('should return null for an unknown callback URL', () => {
    expect(pipe.transform('https://evil.com')).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(pipe.transform('')).toBeNull();
  });
});
