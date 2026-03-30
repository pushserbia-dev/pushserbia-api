import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import mailchimpConfig from './core/config/mailchimp.config';
import { MailchimpModule } from './integrations/mailchimp/mailchimp.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { VotesModule } from './modules/votes/votes.module';
import { ProjectMembersModule } from './modules/project-members/project-members.module';
import { AuthModule } from './modules/auth/auth.module';
import linkedinConfig from './core/config/linkedin.config';
import firebaseConfig from './core/config/firebase.config';
import { AuthMiddleware } from './modules/auth/middlewares/auth.middleware';
import { ValidTokenOnlyMiddleware } from './modules/auth/middlewares/valid-token-only/valid-token-only.middleware';
import authConfig from './core/config/auth.config';
import { UnsplashModule } from './modules/unsplash/unsplash.module';
import { FeedbackModule } from './modules/feedback/feedback.module';

const typeormSynchronize = process.env.TYPEORM_SYNCHRONIZE === 'true';
const typeormMigrationsRun = process.env.TYPEORM_MIGRATIONS_RUN === 'true';

if (typeormSynchronize && typeormMigrationsRun) {
  throw new Error(
    'TYPEORM_SYNCHRONIZE and TYPEORM_MIGRATIONS_RUN cannot both be true. ' +
      'Use synchronize for development, migrationsRun for production.',
  );
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailchimpConfig, linkedinConfig, firebaseConfig, authConfig],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? {
              rejectUnauthorized: !!process.env.DATABASE_CA_CERT,
              ca: process.env.DATABASE_CA_CERT || undefined,
            }
          : false,
      autoLoadEntities: true,
      synchronize: typeormSynchronize,
      migrationsRun: typeormMigrationsRun,
      migrations: ['dist/database/migrations/*{.ts,.js}'],
    }),
    MailchimpModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    VotesModule,
    ProjectMembersModule,
    UnsplashModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const customRoutes = [
      { path: '/users/me', method: RequestMethod.GET },
      { path: '/users/account', method: RequestMethod.GET },
    ];

    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: '', method: RequestMethod.ALL },
        { path: '/auth/set-token-to-cookie', method: RequestMethod.ALL },
        { path: '/integrations/subscribe', method: RequestMethod.POST },
        { path: '/auth/redirect/linkedin', method: RequestMethod.GET },
        { path: '/projects', method: RequestMethod.GET },
        { path: '/projects/(.*)', method: RequestMethod.GET },
        { path: '/projects/:projectId/members', method: RequestMethod.GET },
        ...customRoutes,
      )
      .forRoutes('*');

    consumer.apply(ValidTokenOnlyMiddleware).forRoutes(...customRoutes);
  }
}
