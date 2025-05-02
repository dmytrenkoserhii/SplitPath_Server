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
import { ApiTags } from '@nestjs/swagger';

import { PaginatedResponse } from '@/shared/types';

// TODO
// import { CurrentSession } from '@/modules/auth/decorators/current-session.decorator';
// import { AccessTokenGuard } from '@/modules/auth/guards/access-token.guard';

import { CreatePrivateMessageDto } from '../dtos';
import { Message } from '../entities';
import { PrivateChatGateway } from '../gateways';
import { PrivateMessagesService } from '../services';
import { ConversationPreview } from '../types';

@ApiTags('Private Messages')
@Controller('private-messages')
// @UseGuards(AccessTokenGuard)
export class PrivateMessagesController {
  constructor(
    private readonly privateMessagesService: PrivateMessagesService,
    private readonly privateChatGateway: PrivateChatGateway,
  ) {}

  @Get('conversations')
  async getConversationPreviews(
    // @CurrentSession('id') userId: number,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<ConversationPreview[]> {
    const userId = 1; // TODO: Replace with real user ID from @CurrentSession() decorator
    return this.privateMessagesService.getConversationPreviews(userId, limit);
  }

  @Get('conversations/:friendId')
  async findConversation(
    // @CurrentSession('id') userId: number,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<PaginatedResponse<Message>> {
    const userId = 1;
    return this.privateMessagesService.findConversation(userId, friendId, {
      page,
      limit,
    });
  }

  @Post()
  async create(
    // @CurrentSession('id') userId: number,
    @Body() createMessageDto: CreatePrivateMessageDto,
  ) {
    const userId = 1;
    const message = await this.privateMessagesService.create(userId, createMessageDto);

    await this.privateChatGateway.notifyNewMessage(message);

    return message;
  }

  @Post('mark-as-read/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    // @CurrentSession('id') userId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ): Promise<void> {
    const userId = 1;
    const message = await this.privateMessagesService.markAsRead(messageId, userId);

    // Notify clients about read status change
    if (message) {
      await this.privateChatGateway.notifyMessageRead(message, userId);
    }
  }

  @Post('mark-multiple-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markMultipleAsRead(
    // @CurrentSession('id') userId: number,
    @Body() { messageIds }: { messageIds: number[] },
  ): Promise<void> {
    const userId = 1;
    await this.privateMessagesService.markMultipleAsRead(messageIds, userId);

    // Fetch all messages in a single query instead of one by one
    const messages = await this.privateMessagesService.findMessagesByIds(messageIds);

    // Notify clients about read status changes
    for (const message of messages) {
      await this.privateChatGateway.notifyMessageRead(message, userId);
    }
  }

  @Post('mark-all-read/:fromUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(
    // @CurrentSession('id') userId: number,
    @Param('fromUserId', ParseIntPipe) fromUserId: number,
  ): Promise<void> {
    const userId = 1;
    // First get all unread messages before marking them as read
    const unreadMessages = await this.privateMessagesService.findUnreadMessagesFrom(
      fromUserId,
      userId,
    );

    // Mark all as read
    await this.privateMessagesService.markAllAsRead(userId, fromUserId);

    // Notify about all read messages
    for (const message of unreadMessages) {
      await this.privateChatGateway.notifyMessageRead(message, userId);
    }
  }
}
