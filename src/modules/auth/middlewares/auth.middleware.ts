import { HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  constructor(private readonly firebaseService: FirebaseAuthService) {}

  async use(req: Request, res: Response, next: () => void) {
    try {
      const { __auth } = req.cookies;
      if (!__auth) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'invalid token' });
      }

      const user = await this.firebaseService.authenticate(__auth);
      if (!user.id && req.baseUrl !== '/v1/users/account') {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'invalid id' });
      }

      if (!user.active) {
        this.logger.warn(`Blocked user ${user.id} attempted ${req.method} ${req.baseUrl}${req.path}`);
        return res
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'account is blocked' });
      }

      req['user'] = user;

      next();
    } catch (error) {
      this.logger.warn(`Auth failed for ${req.method} ${req.baseUrl}${req.path}`);
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'invalid token' });
    }
  }
}
