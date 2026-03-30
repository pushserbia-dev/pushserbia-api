import { UnsplashService } from './unsplash.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';
import { AxiosError, AxiosHeaders } from 'axios';

describe('UnsplashService', () => {
  let service: UnsplashService;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
    } as any;
    service = new UnsplashService(httpService);
  });

  describe('searchPhotos', () => {
    it('should return search results with rate limit info', async () => {
      const mockData = {
        total: 100,
        total_pages: 10,
        results: [{ id: '1' }],
      };
      const headers = new AxiosHeaders();
      headers.set('x-ratelimit-limit', '50');
      headers.set('x-ratelimit-remaining', '49');

      httpService.get.mockReturnValue(
        of({
          data: mockData,
          headers,
          status: 200,
          statusText: 'OK',
          config: { headers: new AxiosHeaders() },
        }),
      );

      const result = await service.searchPhotos({ query: 'nature' });

      expect(result).toEqual({
        ...mockData,
        rateLimit: { limit: '50', remaining: '49' },
      });
    });

    it('should throw InternalServerErrorException on API error', async () => {
      const error = new AxiosError('Bad Request', '400', undefined, undefined, {
        data: { errors: ['Rate limit exceeded'] },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      });

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(
        service.searchPhotos({ query: 'nature' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw generic error when no response available', async () => {
      const error = new AxiosError('Network Error');

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(
        service.searchPhotos({ query: 'nature' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
