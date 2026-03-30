import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  AxiosError,
  AxiosResponseHeaders,
  RawAxiosResponseHeaders,
} from 'axios';
import { firstValueFrom } from 'rxjs';
import { Photo } from './interfaces/photo.interface';

@Injectable()
export class UnsplashService {
  constructor(private readonly http: HttpService) {}

  async searchPhotos(params: {
    query: string;
    page?: number;
    per_page?: number;
    order_by?: 'latest' | 'relevant';
    orientation?: 'landscape' | 'portrait' | 'squarish';
  }) {
    try {
      const res = await firstValueFrom(
        this.http.get<Photo[]>('/search/photos', { params }),
      );
      return {
        ...res.data, // { total, total_pages, results: Photo[] }
        rateLimit: this.pickRate(res.headers),
      };
    } catch (error: unknown) {
      this.handleAxiosError(error);
    }
  }

  private pickRate(headers: RawAxiosResponseHeaders | AxiosResponseHeaders) {
    return {
      limit: String(headers['x-ratelimit-limit'] ?? ''),
      remaining: String(headers['x-ratelimit-remaining'] ?? ''),
    };
  }

  private handleAxiosError(e: unknown): never {
    const err = e as AxiosError<{ errors?: string[] }>;
    if (err.response) {
      throw new InternalServerErrorException({
        message: err.response.data?.errors?.[0] ?? 'Unsplash API error',
        status: err.response.status,
      });
    }
    throw new InternalServerErrorException('Unsplash request failed');
  }
}
