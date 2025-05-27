import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';
import { AccessTokenGuard } from '@/modules/auth/guards';
import { PaginatedResponse } from '@/shared/types';

import { CreatePrivateMessageDto } from '../dtos';
import { Message } from '../entities';
import { PrivateChatsGateway } from '../gateways';
import { PrivateMessagesService } from '../services';
import { ChatPreview } from '../types';

@ApiTags('Private Messages')
@Controller('private-messages')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class PrivateMessagesController {
  constructor(
    private readonly privateMessagesService: PrivateMessagesService,
    private readonly privateChatsGateway: PrivateChatsGateway,
  ) {}

  @Get('chats')
  async getChatsPreviews(
    @CurrentSession('sub') sub: number,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<ChatPreview[]> {
    return this.privateMessagesService.getChatsPreviews(sub, limit);
  }

  @Get('chats/:friendId')
  async findChat(
    @CurrentSession('sub') sub: number,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<PaginatedResponse<Message>> {
    return this.privateMessagesService.findChat(sub, friendId, {
      page,
      limit,
    });
  }

  @Post()
  async createMessage(
    @CurrentSession('sub') sub: number,
    @Body() createMessageDto: CreatePrivateMessageDto,
  ) {
    const message = await this.privateMessagesService.createMessage(sub, createMessageDto);

    await this.privateChatsGateway.notifyNewMessage(message);

    return message;
  }

  @Post('mark-multiple-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markMultipleAsRead(
    @CurrentSession('sub') sub: number,
    @Body() { messageIds }: { messageIds: number[] },
  ): Promise<void> {
    await this.privateMessagesService.markMultipleAsRead(messageIds, sub);

    const messages = await this.privateMessagesService.findMessagesByIds(messageIds);

    if (messages.length > 0) {
      await this.privateChatsGateway.notifyMessagesRead(messages, sub);
    }
  }

  @Post('mark-all-read/:fromUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(
    @CurrentSession('sub') sub: number,
    @Param('fromUserId', ParseIntPipe) fromUserId: number,
  ): Promise<void> {
    const unreadMessages = await this.privateMessagesService.findUnreadMessagesFrom(
      fromUserId,
      sub,
    );

    await this.privateMessagesService.markAllAsRead(sub, fromUserId);

    if (unreadMessages.length > 0) {
      await this.privateChatsGateway.notifyMessagesRead(unreadMessages, sub);
    }
  }
}
