import FormData from 'form-data';
import Mailgun, { MailgunMessageData } from 'mailgun.js';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ENV } from '@/shared/enums';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly MAILGUN_KEY: string;
  private readonly MAILGUN_DOMAIN: string;
  private readonly client;

  constructor(private readonly config: ConfigService) {
    this.MAILGUN_KEY = this.config.get<string>(ENV.MAILGUN_KEY, '');
    this.MAILGUN_DOMAIN = this.config.get<string>(ENV.MAILGUN_DOMAIN, '');
    this.client = new Mailgun(FormData).client({
      username: 'api',
      key: this.MAILGUN_KEY,
    });
  }

  /**
   * Send email via API
   *
   * @param data - MailgunMessageData
   */
  async send(data: MailgunMessageData): Promise<void> {
    try {
      const res = await this.client.messages.create(this.MAILGUN_DOMAIN, data);
      this.logger.log(`Email sent successfully: ${JSON.stringify(res)}`);
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`Failed to send email: ${err.message}`, err.stack);
      } else {
        this.logger.error(`Failed to send email`, err);
      }
    }
  }
}
