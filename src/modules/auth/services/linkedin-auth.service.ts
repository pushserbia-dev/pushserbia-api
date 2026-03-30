import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LinkedinUser } from '../models/linkedin-user';
import { LinkedinAccessTokenParams } from '../models/linkedin-access-token-params';
import { LinkedinAccessTokenResponse } from '../models/linkedin-access-token-response';
import { ConfigService } from '@nestjs/config';
import { LinkedinConfig } from '../../../core/config/linkedin.config';

@Injectable()
export class LinkedinAuthService {
  private readonly logger = new Logger(LinkedinAuthService.name);
  private config: LinkedinConfig;

  constructor(private configService: ConfigService) {}

  getConfig(): LinkedinConfig {
    if (this.config) {
      return this.config;
    }
    const config = this.configService.get<LinkedinConfig>('linkedin');
    if (!config) {
      throw new Error('Linkedin config not found');
    }
    this.config = config;
    return this.config;
  }

  getTokenParams(code: string, callback: string): URLSearchParams {
    const config = this.getConfig();
    const params: LinkedinAccessTokenParams = {
      ...config,
      redirect_uri: `${config.redirect_uri}${callback}`,
      grant_type: 'authorization_code',
      code: code,
    };
    return new URLSearchParams(params);
  }

  async getToken(
    code: string,
    callback: string,
  ): Promise<LinkedinAccessTokenResponse> {
    try {
      const body = this.getTokenParams(code, callback).toString();
      const req = await fetch(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!req.ok) {
        this.logger.warn(`LinkedIn token exchange failed with status ${req.status}`);
        throw new UnauthorizedException('Something went wrong');
      }

      return (await req.json()) as LinkedinAccessTokenResponse;
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.error('LinkedIn token exchange error', error);
      }
      throw new UnauthorizedException('Something went wrong');
    }
  }

  async getUser(accessToken: string): Promise<LinkedinUser> {
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        return (await response.json()) as LinkedinUser;
      }

      throw new UnauthorizedException('Something went wrong');
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.error('LinkedIn user info fetch error', error);
      }
      throw new UnauthorizedException('Something went wrong');
    }
  }
}
