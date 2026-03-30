import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as firebaseAdmin from 'firebase-admin';
import { UserRole } from '../../users/enums/user-role';
import { CurrentUser } from '../entities/current.user.entity';
import { LinkedinUser } from '../models/linkedin-user';
import { DecodedIdToken, UserRecord } from 'firebase-admin/lib/auth';
import { ServiceAccount } from 'firebase-admin/lib/app/credential';

interface ExtendedDecodedIdToken extends DecodedIdToken {
  app_user_id: string;
  app_user_role: UserRole;
  app_user_active: boolean;
  name: string;
  email: string;
}

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private admin: firebaseAdmin.app.App;

  constructor(private configService: ConfigService) {}

  private getAdmin() {
    if (this.admin) {
      return this.admin;
    }
    const config = this.configService.get<ServiceAccount>('firebase');
    if (!config) {
      throw new UnauthorizedException('Firebase config is not provided');
    }
    this.admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(config),
    });
    return this.admin;
  }

  async authenticate(token: string): Promise<CurrentUser> {
    try {
      const decodedToken = (await this.getAdmin()
        .auth()
        .verifyIdToken(token)) as ExtendedDecodedIdToken;
      return {
        id: decodedToken.app_user_id,
        email: decodedToken.email,
        uid: decodedToken.uid,
        name: decodedToken.name,
        imageUrl: decodedToken.picture,
        role: decodedToken.app_user_role || UserRole.Participant,
        // Intentionally using !== false so new users without claims default to active.
        // Blocking is an explicit admin action (app_user_active is set to false).
        active: decodedToken.app_user_active !== false,
      };
    } catch (error) {
      this.logger.warn('Firebase token verification failed', error);
      throw new UnauthorizedException('Something went wrong');
    }
  }

  async authenticateWithLinkedin(data: LinkedinUser): Promise<string> {
    let user: UserRecord;
    try {
      user = await this.getAdmin().auth().getUserByEmail(data.email);
    } catch (err: any) {
      if (err?.errorInfo?.code !== 'auth/user-not-found') {
        this.logger.error('Firebase getUserByEmail error', err);
        throw new UnauthorizedException('Something went wrong');
      }
      try {
        user = await this.getAdmin().auth().createUser({
          email: data.email,
          emailVerified: data.email_verified,
          displayName: data.name,
          photoURL: data.picture,
          uid: data.sub,
        });
      } catch (createErr) {
        this.logger.error('Firebase createUser failed', createErr);
        throw new UnauthorizedException('Something went wrong');
      }
    }
    try {
      const customToken = await this.getAdmin()
        .auth()
        .createCustomToken(user.uid);
      return customToken;
    } catch (error) {
      this.logger.error('Firebase custom token creation failed', error);
      throw new UnauthorizedException('Something went wrong');
    }
  }

  async setCustomUserData(
    uid: string,
    data: {
      app_user_id: string;
      app_user_role: UserRole;
      app_user_active: boolean;
    },
  ): Promise<any> {
    try {
      await this.getAdmin().auth().setCustomUserClaims(uid, data);
      return { message: 'success' };
    } catch (error) {
      this.logger.error('Firebase setCustomUserClaims failed', error);
      throw new UnauthorizedException('Something went wrong');
    }
  }
}
