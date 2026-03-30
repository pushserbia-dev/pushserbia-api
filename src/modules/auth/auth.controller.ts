import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './services/auth.service';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { CallbackPipe } from './validators/callback.pipe';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private firebaseAuthService: FirebaseAuthService,
  ) {}

  @Get('redirect/linkedin')
  async linkedinRedirect(
    @Query('code') code: string,
    @Query('callback', CallbackPipe) callback: string,
    @Res() res: Response,
  ) {
    const response = await this.authService.redirectionHandler(code, callback);

    return res.redirect(response.status, response.url);
  }

  @Post('set-token-to-cookie')
  async setTokenCookie(
    @Req() req: Request,
    @Res() res: Response,
    @Body('token') token: string,
  ) {
    try {
      if (token) {
        // Verify the token is valid before storing it as a cookie
        await this.firebaseAuthService.authenticate(token);

        res.cookie('__auth', token, {
          maxAge: 24 * 60 * 60 * 1000, // 1 dana
          httpOnly: true,
          secure: this.authService.getConfig().isSecureCookie,
          sameSite: 'lax',
        });
      } else {
        res.clearCookie('__auth');
      }

      res.status(HttpStatus.OK).json({});
    } catch {
      res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Invalid token',
      });
    }
  }
}
