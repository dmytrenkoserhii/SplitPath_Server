import * as crypto from 'crypto';

import axios, { AxiosInstance } from 'axios';

import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '@/modules/users/services/users.service';
import { ENV } from '@/shared/enums/env.enum';
import { ErrorHandler } from '@/shared/utils';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
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
    this.logger.log('LemonSqueezy API client initialized');
  }

  async createCheckout(productId: string, userId: string) {
    try {
      this.logger.log(`Creating checkout for user ${userId}, product ${productId}`);
      const storeId = this.configService.get(ENV.LEMON_SQUEEZY_STORE_ID);

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

      this.logger.log(`Checkout created successfully for user ${userId}`);

      return { checkoutUrl: response.data.data.attributes.url };
    } catch (error: unknown) {
      this.logger.error(`Failed to create checkout for user ${userId}`, error);
      throw new HttpException('Failed to create checkout', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async handleWebhook(signature: string, rawBody: string, eventType: string, body: any) {
    try {
      this.logger.debug(`Processing ${eventType} webhook`);

      const secret = this.configService.get(ENV.LEMON_SQUEEZY_WEBHOOK_SIGNATURE);
      const hmac = crypto.createHmac('sha256', secret);
      const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
      const signatureBuffer = Buffer.from(signature || '', 'utf8');

      if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
        this.logger.warn('Invalid webhook signature received');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      if (eventType === 'order_created') {
        const userId = body.meta.custom_data.user_id;
        const isSuccessful = body.data.attributes.status === 'paid';
        const orderStatus = body.data.attributes.status;

        this.logger.log(`Processing order for user ${userId} with status: ${orderStatus}`);
        await this.processPayment(userId, isSuccessful, body);
      } else {
        this.logger.debug(`Skipping unhandled event type: ${eventType}`);
      }

      this.logger.log('Webhook processed successfully');
      return { message: 'Webhook processed successfully' };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      ErrorHandler.handle(error, this.logger, 'PaymentsService.handleWebhook');
    }
  }

  private async processPayment(userId: string, isSuccessful: boolean, invoiceData: any) {
    try {
      this.logger.log(
        `Processing payment for user ${userId}, status: ${isSuccessful ? 'successful' : 'failed'}`,
      );

      const orderId = invoiceData.data.id;
      this.logger.debug(`Order ID: ${orderId}`);

      await this.usersService.update(Number(userId), { isPremium: isSuccessful });

      this.logger.log(`Payment processing completed for user ${userId}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to process payment for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      ErrorHandler.handle(error, this.logger, 'PaymentsService.processPayment');
    }
  }
}
