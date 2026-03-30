import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole: UserRole): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole } }),
      }),
    } as any;
  }

  it('should allow access when no roles are defined', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    const context = createMockContext(UserRole.Participant);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has the required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([UserRole.Admin]);
    const context = createMockContext(UserRole.Admin);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have the required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([UserRole.Admin]);
    const context = createMockContext(UserRole.Participant);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when user has one of multiple required roles', () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue([UserRole.Admin, UserRole.Developer]);
    const context = createMockContext(UserRole.Developer);

    expect(guard.canActivate(context)).toBe(true);
  });
});
