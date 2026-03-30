import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  isSecureCookie: boolean;
  callbackUrls: string[];
  productionLoginPage: string;
  loginPage: string;
  accountPage: string;
}

export default registerAs<AuthConfig>('auth', () => ({
  isSecureCookie: process.env.AUTH_SECURE_COOKIE === 'true',
  callbackUrls: (process.env.AUTH_CALLBACK_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  productionLoginPage: process.env.AUTH_PRODUCTION_LOGIN_PAGE || '',
  loginPage: process.env.AUTH_LOGIN_PAGE_URL || '',
  accountPage: process.env.AUTH_ACCOUNT_PAGE_URL || '',
}));
