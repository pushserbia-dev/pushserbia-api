import { UnsplashController } from './unsplash.controller';
import { UnsplashService } from './unsplash.service';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('UNSPLASH_BASE_URL')!,
        headers: {
          Authorization: `Client-ID ${config.get<string>('UNSPLASH_ACCESS_KEY')!}`,
          'Accept-Version': 'v1',
        },
        timeout: 5000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UnsplashController],
  providers: [UnsplashService],
  exports: [UnsplashService],
})
export class UnsplashModule {}
