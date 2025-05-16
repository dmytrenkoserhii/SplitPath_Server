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
import { PrivateChatGateway } from '../gateways';
import { PrivateMessagesService } from '../services';
import { ConversationPreview } from '../types';

@ApiTags('Private Messages')
@Controller('private-messages')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class PrivateMessagesController {
  constructor(
    private readonly privateMessagesService: PrivateMessagesService,
    private readonly privateChatGateway: PrivateChatGateway,
  ) {}

  @Get('conversations')
  async getConversationPreviews(
    @CurrentSession('sub') sub: number,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<ConversationPreview[]> {
    return this.privateMessagesService.getConversationPreviews(sub, limit);
  }

  @Get('conversations/:friendId')
  async findConversation(
    @CurrentSession('sub') sub: number,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<PaginatedResponse<Message>> {
    return this.privateMessagesService.findConversation(sub, friendId, {
      page,
      limit,
    });
  }

  @Post()
  async create(
    @CurrentSession('sub') sub: number,
    @Body() createMessageDto: CreatePrivateMessageDto,
  ) {
    const message = await this.privateMessagesService.create(sub, createMessageDto);

    await this.privateChatGateway.notifyNewMessage(message);

    return message;
  }

  @Post('mark-as-read/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    @CurrentSession('sub') sub: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ): Promise<void> {
    const message = await this.privateMessagesService.markAsRead(sub, messageId);

    // Notify clients about read status change
    if (message) {
      await this.privateChatGateway.notifyMessageRead(message, sub);
    }
  }

  @Post('mark-multiple-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markMultipleAsRead(
    @CurrentSession('sub') sub: number,
    @Body() { messageIds }: { messageIds: number[] },
  ): Promise<void> {
    await this.privateMessagesService.markMultipleAsRead(messageIds, sub);

    // Fetch all messages in a single query instead of one by one
    const messages = await this.privateMessagesService.findMessagesByIds(messageIds);

    // Notify clients about read status changes
    for (const message of messages) {
      await this.privateChatGateway.notifyMessageRead(message, sub);
    }
  }

  @Post('mark-all-read/:fromUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(
    @CurrentSession('sub') sub: number,
    @Param('fromUserId', ParseIntPipe) fromUserId: number,
  ): Promise<void> {
    // First get all unread messages before marking them as read
    const unreadMessages = await this.privateMessagesService.findUnreadMessagesFrom(
      fromUserId,
      sub,
    );

    // Mark all as read
    await this.privateMessagesService.markAllAsRead(sub, fromUserId);

    // Notify about all read messages
    for (const message of unreadMessages) {
      await this.privateChatGateway.notifyMessageRead(message, sub);
    }
  }
}
