import { ValidTokenOnlyMiddleware } from './valid-token-only.middleware';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { HttpStatus } from '@nestjs/common';
import { UserRole } from '../../../users/enums/user-role';

describe('ValidTokenOnlyMiddleware', () => {
  let middleware: ValidTokenOnlyMiddleware;
  let firebaseService: jest.Mocked<FirebaseAuthService>;
  let mockResponse: any;
  let nextFn: jest.Mock;

  beforeEach(() => {
    firebaseService = {
      authenticate: jest.fn(),
    } as any;
    middleware = new ValidTokenOnlyMiddleware(firebaseService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
  });

  it('should return 401 when no auth cookie is present', async () => {
    const req = { cookies: {} } as any;

    await middleware.use(req, mockResponse, nextFn);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should set user and call next on valid token', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      uid: 'uid',
      name: 'Test',
      imageUrl: undefined,
      role: UserRole.Participant,
      active: true,
    };
    firebaseService.authenticate.mockResolvedValue(mockUser);
    const req = { cookies: { __auth: 'valid-token' } } as any;

    await middleware.use(req, mockResponse, nextFn);

    expect(req.user).toEqual(mockUser);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should return 403 when user is blocked', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      uid: 'uid',
      name: 'Test',
      imageUrl: undefined,
      role: UserRole.Participant,
      active: false,
    };
    firebaseService.authenticate.mockResolvedValue(mockUser);
    const req = { cookies: { __auth: 'valid-token' } } as any;

    await middleware.use(req, mockResponse, nextFn);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should return 401 when authentication fails', async () => {
    firebaseService.authenticate.mockRejectedValue(new Error('bad'));
    const req = { cookies: { __auth: 'bad-token' } } as any;

    await middleware.use(req, mockResponse, nextFn);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(nextFn).not.toHaveBeenCalled();
  });
});
