import { registerAs } from '@nestjs/config';
import { ServiceAccount } from 'firebase-admin/lib/app/credential';

export default registerAs<ServiceAccount>('firebase', () => ({
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
}));
