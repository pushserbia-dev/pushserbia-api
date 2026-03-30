import { AuthMiddleware } from './auth.middleware';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { HttpStatus } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let firebaseService: jest.Mocked<FirebaseAuthService>;
  let mockRequest: any;
  let mockResponse: any;
  let nextFn: jest.Mock;

  beforeEach(() => {
    firebaseService = {
      authenticate: jest.fn(),
    } as any;
    middleware = new AuthMiddleware(firebaseService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
  });

  it('should return 401 when no auth cookie is present', async () => {
    mockRequest = { cookies: {} };

    await middleware.use(mockRequest, mockResponse, nextFn);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should call next and set user on valid token', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      uid: 'firebase-uid',
      name: 'Test',
      imageUrl: undefined,
      role: UserRole.Participant,
      active: true,
    };
    firebaseService.authenticate.mockResolvedValue(mockUser);
    mockRequest = { cookies: { __auth: 'valid-token' }, baseUrl: '/v1/users' };

    await middleware.use(mockRequest, mockResponse, nextFn);

    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should return BAD_REQUEST when user has no id and path is not /account', async () => {
    const mockUser = {
      id: undefined,
      email: 'test@test.com',
      uid: 'firebase-uid',
      name: 'Test',
      imageUrl: undefined,
      role: UserRole.Participant,
      active: true,
    };
    firebaseService.authenticate.mockResolvedValue(mockUser as any);
    mockRequest = {
      cookies: { __auth: 'valid-token' },
      baseUrl: '/v1/users/me',
    };

    await middleware.use(mockRequest, mockResponse, nextFn);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should allow through when user has no id but path is /account', async () => {
    const mockUser = {
      id: undefined,
      email: 'test@test.com',
      uid: 'firebase-uid',
      name: 'Test',
      imageUrl: undefined,
      role: UserRole.Participant,
      active: true,
    };
    firebaseService.authenticate.mockResolvedValue(mockUser as any);
    mockRequest = {
      cookies: { __auth: 'valid-token' },
      baseUrl: '/v1/users/account',
    };

    await middleware.use(mockRequest, mockResponse, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });

  it('should return 403 when user is blocked (active=false)', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      uid: 'firebase-uid',
      name: 'Test',
      imageUrl: undefined,
      role: UserRole.Participant,
      active: false,
    };
    firebaseService.authenticate.mockResolvedValue(mockUser);
    mockRequest = {
      cookies: { __auth: 'valid-token' },
      baseUrl: '/v1/projects',
      path: '/',
      method: 'POST',
    };

    await middleware.use(mockRequest, mockResponse, nextFn);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should return 401 when firebase throws', async () => {
    firebaseService.authenticate.mockRejectedValue(new Error('Invalid token'));
    mockRequest = { cookies: { __auth: 'bad-token' } };

    await middleware.use(mockRequest, mockResponse, nextFn);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(nextFn).not.toHaveBeenCalled();
  });
});
