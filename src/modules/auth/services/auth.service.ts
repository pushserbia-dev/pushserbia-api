import { HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseAuthService } from './firebase-auth.service';
import { LinkedinAuthService } from './linkedin-auth.service';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from '../../../core/config/auth.config';

@Injectable()
export class AuthService {
  private config: AuthConfig;

  constructor(
    private firebaseAuthService: FirebaseAuthService,
    private linkedinAuthService: LinkedinAuthService,
    private configService: ConfigService,
  ) {}

  getConfig(): AuthConfig {
    if (this.config) {
      return this.config;
    }
    const config = this.configService.get<AuthConfig>('auth')!;
    this.config = config;
    return this.config;
  }

  async redirectionHandler(
    code: string,
    callback: string,
  ): Promise<{
    status: number;
    url: string;
  }> {
    if (!callback) {
      return {
        status: HttpStatus.FOUND,
        url: this.getConfig().productionLoginPage,
      };
    }

    const token = await this.linkedinAuthService.getToken(code, callback);
    if (!token) {
      return {
        status: HttpStatus.FOUND,
        url: `${callback}/${this.getConfig().loginPage}`,
      };
    }

    const user = await this.linkedinAuthService.getUser(token.access_token);
    if (!user) {
      return {
        status: HttpStatus.FOUND,
        url: `${callback}/${this.getConfig().loginPage}`,
      };
    }

    const firebaseToken =
      await this.firebaseAuthService.authenticateWithLinkedin(user);

    return {
      status: HttpStatus.FOUND,
      url: `${callback}/${this.getConfig().accountPage}?customToken=${encodeURIComponent(firebaseToken)}`,
    };
  }
}
