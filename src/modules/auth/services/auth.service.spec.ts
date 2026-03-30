import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { LinkedinAuthService } from './linkedin-auth.service';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let firebaseAuthService: jest.Mocked<FirebaseAuthService>;
  let linkedinAuthService: jest.Mocked<LinkedinAuthService>;
  let configService: jest.Mocked<ConfigService>;

  const mockConfig = {
    isSecureCookie: false,
    callbackUrls: ['http://localhost:3000'],
    productionLoginPage: 'https://pushserbia.com/login',
    loginPage: 'login',
    accountPage: 'account',
  };

  beforeEach(() => {
    firebaseAuthService = {
      authenticateWithLinkedin: jest.fn(),
    } as any;
    linkedinAuthService = {
      getToken: jest.fn(),
      getUser: jest.fn(),
    } as any;
    configService = {
      get: jest.fn().mockReturnValue(mockConfig),
    } as any;

    service = new AuthService(
      firebaseAuthService,
      linkedinAuthService,
      configService,
    );
  });

  describe('getConfig', () => {
    it('should return auth config', () => {
      const result = service.getConfig();
      expect(result).toEqual(mockConfig);
    });

    it('should cache config on subsequent calls', () => {
      service.getConfig();
      service.getConfig();
      expect(configService.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('redirectionHandler', () => {
    it('should redirect to production login page when callback is falsy', async () => {
      const result = await service.redirectionHandler('code', '');

      expect(result).toEqual({
        status: HttpStatus.FOUND,
        url: mockConfig.productionLoginPage,
      });
    });

    it('should redirect to login page when token is null', async () => {
      linkedinAuthService.getToken.mockResolvedValue(null as any);

      const result = await service.redirectionHandler(
        'code',
        'http://localhost:3000',
      );

      expect(result).toEqual({
        status: HttpStatus.FOUND,
        url: 'http://localhost:3000/login',
      });
    });

    it('should redirect to login page when user is null', async () => {
      linkedinAuthService.getToken.mockResolvedValue({
        access_token: 'token',
      } as any);
      linkedinAuthService.getUser.mockResolvedValue(null as any);

      const result = await service.redirectionHandler(
        'code',
        'http://localhost:3000',
      );

      expect(result).toEqual({
        status: HttpStatus.FOUND,
        url: 'http://localhost:3000/login',
      });
    });

    it('should redirect to account page with custom token on success', async () => {
      linkedinAuthService.getToken.mockResolvedValue({
        access_token: 'linkedin-token',
      } as any);
      linkedinAuthService.getUser.mockResolvedValue({
        sub: 'sub',
        name: 'Test',
        email: 'test@test.com',
        email_verified: true,
        picture: 'pic.jpg',
      });
      firebaseAuthService.authenticateWithLinkedin.mockResolvedValue(
        'firebase-custom-token',
      );

      const result = await service.redirectionHandler(
        'code',
        'http://localhost:3000',
      );

      expect(result).toEqual({
        status: HttpStatus.FOUND,
        url: 'http://localhost:3000/account?customToken=firebase-custom-token',
      });
    });
  });
});
