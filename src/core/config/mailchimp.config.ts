import { registerAs } from '@nestjs/config';

export interface MailchimpConfig {
  enabled: boolean;
  token: string;
  limit: number;
}

export default registerAs<MailchimpConfig>('mailchimp', () => ({
  enabled: process.env.MAILCHIMP_ENABLE === 'true',
  token: process.env.MAILCHIMP_TOKEN || '',
  limit: process.env.MAILCHIMP_LIMIT
    ? parseInt(process.env.MAILCHIMP_LIMIT, 10)
    : 2000,
}));
