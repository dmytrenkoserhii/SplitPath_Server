import { Request } from 'express';

import { Body, Controller, Headers, HttpStatus, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';

import { CreateCheckoutDto } from '../dtos/create-checkout.dto';
import { PaymentsService } from '../services/payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create checkout session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Checkout session created successfully' })
  @Post('create-checkout')
  async createCheckout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @CurrentSession('sub') userId: number,
  ) {
    return this.paymentsService.createCheckout(createCheckoutDto.productId, userId.toString());
  }

  @ApiOperation({ summary: 'Handle payment webhook' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed successfully' })
  @Post('webhook')
  async handleWebhook(
    @Headers('X-Signature') signature: string,
    @Headers('X-Event-Name') eventType: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const rawBody = request.rawBody?.toString() || '';
    const body = JSON.parse(rawBody);
    return this.paymentsService.handleWebhook(signature, rawBody, eventType, body);
  }
}
