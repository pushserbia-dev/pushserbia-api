import { SubscribeMailchimpDto } from './dto/subscribe-mailchimp.dto';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MailchimpConfig } from '../../core/config/mailchimp.config';
import Mailchimp from 'mailchimp-api-v3';

interface MailchimpBody {
  tags?: string[];
  email_address: string;
  status: string;
  merge_fields?: {
    FNAME?: string;
    PHONE?: string;
    MESSAGE?: string;
  };
}

@Injectable()
export class MailchimpService {
  private readonly logger = new Logger(MailchimpService.name);
  private config: MailchimpConfig;
  private mailchimp: Mailchimp;

  constructor(private configService: ConfigService) {}

  getConfig(): MailchimpConfig {
    if (this.config) {
      return this.config;
    }
    const config = this.configService.get<MailchimpConfig>('mailchimp');
    if (!config?.enabled) {
      this.logger.error('Mailchimp service is disabled — set MAILCHIMP_ENABLE=true');
      throw new HttpException('Newsletter service is currently unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
    if (!config.token) {
      this.logger.error('Mailchimp token is not defined — set MAILCHIMP_TOKEN');
      throw new HttpException('Newsletter service is currently unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
    this.config = config;
    return this.config;
  }

  getMailchimp(): Mailchimp {
    if (this.mailchimp) {
      return this.mailchimp;
    }

    this.mailchimp = new Mailchimp(this.getConfig().token);

    return this.mailchimp;
  }

  async subscribe(createMailchimpDto: SubscribeMailchimpDto) {
    const fetchResponse = await this.getMailchimp().request({
      method: 'get',
      path: '/lists',
    });
    const { lists, total_items, statusCode } = fetchResponse;
    if (!total_items) {
      this.logger.error('There is no defined mailing list');
      throw new HttpException('Service is disabled', HttpStatus.BAD_REQUEST);
    }
    if (statusCode !== 200) {
      this.logger.error('Something went wrong during fetching mailing lists');
      throw new HttpException('Service is disabled', HttpStatus.BAD_REQUEST);
    }

    let activeList = lists.find(
      (list: any) => list.stats.member_count < this.getConfig().limit,
    );
    if (!activeList) {
      this.logger.warn('Every mailing list is full');
      activeList = lists[lists.length - 1];
    }

    const body: MailchimpBody = {
      email_address: createMailchimpDto.email,
      status: 'subscribed',
    };
    const { tags, name, phone, message } = createMailchimpDto;
    if (tags) {
      body.tags = [tags];
    }
    if (name) {
      body.merge_fields = { FNAME: name };
    }
    if (phone) {
      body.merge_fields = { ...(body.merge_fields || {}), PHONE: phone };
    }
    if (message) {
      body.merge_fields = { ...(body.merge_fields || {}), MESSAGE: message };
    }

    try {
      await this.getMailchimp().request({
        method: 'post',
        path: `/lists/${activeList.id}/members`,
        body,
      });

      return;
    } catch (e) {
      this.logger.error('Something went wrong during creating subscriber');
      if (e.statusCode === 400 && e.title === 'Member Exists') {
        return;
      }
      throw new HttpException('Something is wrong.', HttpStatus.BAD_REQUEST);
    }
  }
}
