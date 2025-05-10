import * as crypto from 'crypto';

import axios, { AxiosInstance } from 'axios';

import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '@/modules/users/services/users.service';
import { ENV } from '@/shared/enums/env.enum';

@Injectable()
export class PaymentsService {
  private readonly lemonSqueezyApi: AxiosInstance;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {
    const apiUrl = this.configService.get(ENV.LEMON_SQUEEZY_API_URL);
    const apiKey = this.configService.get(ENV.LEMON_SQUEEZY_API_KEY);

    this.lemonSqueezyApi = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async createCheckout(productId: string, userId: string) {
    const storeId = this.configService.get(ENV.LEMON_SQUEEZY_STORE_ID);

    try {
      const response = await this.lemonSqueezyApi.post('/checkouts', {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: {
                user_id: userId,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: productId,
              },
            },
          },
        },
      });

      return { checkoutUrl: response.data.data.attributes.url };
    } catch {
      throw new HttpException('Failed to create checkout', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async handleWebhook(signature: string, rawBody: string, eventType: string, body: any) {
    const secret = this.configService.get(ENV.LEMON_SQUEEZY_WEBHOOK_SIGNATURE);
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    if (eventType === 'order_created') {
      const userId = body.meta.custom_data.user_id;
      const isSuccessful = body.data.attributes.status === 'paid';

      await this.processPayment(userId, isSuccessful, body);
    }

    return { message: 'Webhook processed successfully' };
  }

  private async processPayment(userId: string, isSuccessful: boolean, invoiceData: any) {
    await this.usersService.update(Number(userId), { isPremium: isSuccessful });
  }
}
