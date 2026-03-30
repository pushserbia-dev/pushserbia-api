import { LinkedinAuthService } from './linkedin-auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LinkedinAuthService', () => {
  let service: LinkedinAuthService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfig = {
    redirect_uri: 'https://api.example.com/auth/redirect/linkedin?callback=',
    client_id: 'test-client-id',
    client_secret: 'test-client-secret',
  };

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue(mockConfig),
    } as any;
    service = new LinkedinAuthService(configService);
    mockFetch.mockReset();
  });

  describe('getConfig', () => {
    it('should return linkedin config', () => {
      expect(service.getConfig()).toEqual(mockConfig);
    });

    it('should throw when config is not found', () => {
      configService.get.mockReturnValue(undefined);
      // Reset cached config
      service = new LinkedinAuthService(configService);

      expect(() => service.getConfig()).toThrow('Linkedin config not found');
    });
  });

  describe('getTokenParams', () => {
    it('should build correct URLSearchParams', () => {
      const params = service.getTokenParams('auth-code', 'http://localhost');
      const obj = Object.fromEntries(params.entries());

      expect(obj).toEqual(
        expect.objectContaining({
          code: 'auth-code',
          grant_type: 'authorization_code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        }),
      );
      expect(obj.redirect_uri).toContain('http://localhost');
    });
  });

  describe('getToken', () => {
    it('should return token on success', async () => {
      const tokenResponse = { access_token: 'token123', expires_in: 3600 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(tokenResponse),
      });

      const result = await service.getToken('code', 'http://localhost');
      expect(result).toEqual(tokenResponse);
    });

    it('should throw UnauthorizedException when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400 });

      await expect(
        service.getToken('bad-code', 'http://localhost'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        service.getToken('code', 'http://localhost'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUser', () => {
    it('should return user on success', async () => {
      const userData = {
        sub: 'sub123',
        name: 'Test User',
        email: 'test@test.com',
        email_verified: true,
        picture: 'pic.jpg',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(userData),
      });

      const result = await service.getUser('access-token');
      expect(result).toEqual(userData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/userinfo',
        expect.objectContaining({
          headers: { Authorization: 'Bearer access-token' },
        }),
      );
    });

    it('should throw UnauthorizedException when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 });

      await expect(service.getUser('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
