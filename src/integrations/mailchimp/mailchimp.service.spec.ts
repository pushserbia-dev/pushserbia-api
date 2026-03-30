import { MailchimpService } from './mailchimp.service';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

describe('MailchimpService', () => {
  let service: MailchimpService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;
    service = new MailchimpService(configService);
  });

  describe('getConfig', () => {
    it('should throw when service is disabled', () => {
      configService.get.mockReturnValue({ enabled: false });

      expect(() => service.getConfig()).toThrow(HttpException);
    });

    it('should throw when token is not defined', () => {
      configService.get.mockReturnValue({ enabled: true, token: '' });

      expect(() => service.getConfig()).toThrow(HttpException);
    });

    it('should return config when enabled with token', () => {
      const config = { enabled: true, token: 'abc', limit: 2000 };
      configService.get.mockReturnValue(config);

      expect(service.getConfig()).toEqual(config);
    });

    it('should cache config on subsequent calls', () => {
      const config = { enabled: true, token: 'abc', limit: 2000 };
      configService.get.mockReturnValue(config);

      service.getConfig();
      service.getConfig();

      expect(configService.get).toHaveBeenCalledTimes(1);
    });
  });
});
