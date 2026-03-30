import { FirebaseAuthService } from './firebase-auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;
    service = new FirebaseAuthService(configService);
  });

  describe('authenticate', () => {
    it('should throw UnauthorizedException when firebase config is missing', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(service.authenticate('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('authenticateWithLinkedin', () => {
    it('should throw UnauthorizedException when firebase config is missing', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(
        service.authenticateWithLinkedin({
          sub: 'sub',
          name: 'Test',
          email: 'test@test.com',
          email_verified: true,
          picture: 'pic.jpg',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('setCustomUserData', () => {
    it('should throw UnauthorizedException when firebase config is missing', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(
        service.setCustomUserData('uid', {
          app_user_id: 'id',
          app_user_role: 'participant' as any,
          app_user_active: true,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
