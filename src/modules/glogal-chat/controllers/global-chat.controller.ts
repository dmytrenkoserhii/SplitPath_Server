import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';
import { AccessTokenGuard } from '@/modules/auth/guards';
import { PaginatedResponse } from '@/shared/types';

import { CreateGlobalChatMessageDto } from '../dtos';
import { GlobalChatMessage } from '../entities';
import { GlobalChatGateway } from '../gateways';
import { GlobalChatService } from '../services';

@ApiTags('Global Chat')
@Controller('global-chat')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class GlobalChatController {
  constructor(
    private readonly globalChatService: GlobalChatService,
    private readonly globalChatGateway: GlobalChatGateway,
  ) {}

  @Get('messages')
  async getMessages(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<PaginatedResponse<GlobalChatMessage>> {
    return this.globalChatService.findAllMessages(page, limit);
  }

  @Post()
  async createMessage(
    @CurrentSession('sub') sub: number,
    @Body() createMessageDto: CreateGlobalChatMessageDto,
  ): Promise<GlobalChatMessage> {
    const message = await this.globalChatService.createMessage(sub, createMessageDto);

    await this.globalChatGateway.notifyNewMessage(message);

    return message;
  }
}
