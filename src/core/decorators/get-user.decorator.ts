import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../../modules/auth/entities/current.user.entity';

export const GetUser = createParamDecorator<CurrentUser>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUser }>();
    return request.user;
  },
);
