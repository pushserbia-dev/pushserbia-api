import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let firebaseAuthService: jest.Mocked<FirebaseAuthService>;

  beforeEach(() => {
    authService = {
      redirectionHandler: jest.fn(),
      getConfig: jest.fn().mockReturnValue({
        isSecureCookie: false,
      }),
    } as any;
    firebaseAuthService = {
      authenticate: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        uid: 'firebase-uid',
        name: 'Test',
        role: 'participant',
      }),
    } as any;
    controller = new AuthController(authService, firebaseAuthService);
  });

  describe('linkedinRedirect', () => {
    it('should redirect with status and url from authService', async () => {
      authService.redirectionHandler.mockResolvedValue({
        status: HttpStatus.FOUND,
        url: 'https://example.com/account?customToken=abc',
      });

      const mockRes = { redirect: jest.fn() } as any;

      await controller.linkedinRedirect('code', 'http://localhost', mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        HttpStatus.FOUND,
        'https://example.com/account?customToken=abc',
      );
    });
  });

  describe('setTokenCookie', () => {
    it('should set cookie when token is valid', async () => {
      const mockRes = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockReq = {} as any;

      await controller.setTokenCookie(mockReq, mockRes, 'valid-token');

      expect(firebaseAuthService.authenticate).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        '__auth',
        'valid-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('should return 401 when token is invalid', async () => {
      firebaseAuthService.authenticate.mockRejectedValue(new Error('invalid'));
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockReq = {} as any;

      await controller.setTokenCookie(mockReq, mockRes, 'bad-token');

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('should clear cookie when token is empty', async () => {
      const mockRes = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockReq = {} as any;

      await controller.setTokenCookie(mockReq, mockRes, '');

      expect(mockRes.clearCookie).toHaveBeenCalledWith('__auth');
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });
});
