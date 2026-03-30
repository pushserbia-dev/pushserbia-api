import { MailchimpController } from './mailchimp.controller';
import { MailchimpService } from './mailchimp.service';

describe('MailchimpController', () => {
  let controller: MailchimpController;
  let service: jest.Mocked<MailchimpService>;

  beforeEach(() => {
    service = {
      subscribe: jest.fn(),
    } as any;
    controller = new MailchimpController(service);
  });

  describe('subscribe', () => {
    it('should call service.subscribe with the dto', async () => {
      const dto = { email: 'test@test.com', tags: 'newsletter' as any };
      service.subscribe.mockResolvedValue(undefined);

      await controller.subscribe(dto as any);

      expect(service.subscribe).toHaveBeenCalledWith(dto);
    });
  });
});
