import { In, Repository } from 'typeorm';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FriendsService } from '@/modules/friends/services/friends.service';
import { UsersService } from '@/modules/users/services/users.service';
import { PaginatedResponse } from '@/shared/types/paginated-response.interface';
import { ErrorHandler } from '@/shared/utils';

import { CreatePrivateMessageDto } from '../dtos';
import { Message } from '../entities';
import { ChatPreview } from '../types';

interface GetConversationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class PrivateMessagesService {
  private readonly logger = new Logger(PrivateMessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly friendsService: FriendsService,
    private readonly usersService: UsersService,
  ) {}

  async findChat(
    userId1: number,
    userId2: number,
    options: GetConversationOptions,
  ): Promise<PaginatedResponse<Message>> {
    try {
      // Verify friendship status
      const areFriends = await this.friendsService.areFriends(userId1, userId2);
      if (!areFriends) {
        throw new BadRequestException('Can only view messages between friends');
      }

      const [messages, total] = await this.messagesRepository.findAndCount({
        where: [
          { from: { id: userId1 }, to: { id: userId2 } },
          { from: { id: userId2 }, to: { id: userId1 } },
        ],
        order: { createdAt: 'DESC' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        relations: ['from', 'from.account', 'to', 'to.account'],
      });
      console.log(messages);

      return {
        items: messages,
        meta: {
          total,
          currentPage: options.page,
          itemsPerPage: options.limit,
          totalPages: Math.ceil(total / options.limit),
          hasNextPage: options.page < Math.ceil(total / options.limit),
        },
      };
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.findChat');
    }
  }

  async findMessagesByIds(messageIds: number[]): Promise<Message[]> {
    try {
      return this.messagesRepository.find({
        where: { id: In(messageIds) },
        relations: ['from', 'from.account', 'to', 'to.account'],
      });
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.findMessagesByIds');
    }
  }

  async findUnreadMessagesFrom(fromUserId: number, toUserId: number): Promise<Message[]> {
    try {
      return this.messagesRepository.find({
        where: {
          from: { id: fromUserId },
          to: { id: toUserId },
          read: false,
        },
        relations: ['from', 'from.account', 'to', 'to.account'],
      });
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.findUnreadMessagesFrom');
    }
  }

  async createMessage(
    fromUserId: number,
    createMessageDto: CreatePrivateMessageDto,
  ): Promise<Message> {
    try {
      // Verify friendship status
      const areFriends = await this.friendsService.areFriends(
        fromUserId,
        createMessageDto.toUserId,
      );
      if (!areFriends) {
        throw new BadRequestException('Can only send messages to friends');
      }

      // Create and save message with relations
      const message = await this.messagesRepository.save({
        content: createMessageDto.content,
        from: { id: fromUserId },
        to: { id: createMessageDto.toUserId },
        read: false,
      });

      // Fetch complete message with relations
      return this.messagesRepository.findOne({
        where: { id: message.id },
        relations: ['from', 'from.account', 'to', 'to.account'],
      }) as Promise<Message>;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.create');
    }
  }

  async markAsRead(messageId: number, userId: number): Promise<Message> {
    try {
      const message = await this.messagesRepository.findOne({
        where: { id: messageId, to: { id: userId } },
        relations: ['from', 'from.account', 'to', 'to.account'],
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      message.read = true;
      return this.messagesRepository.save(message);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.markAsRead');
    }
  }

  async markMultipleAsRead(messageIds: number[], userId: number): Promise<void> {
    try {
      await this.messagesRepository.update(
        {
          id: In(messageIds),
          to: { id: userId },
          read: false,
        },
        { read: true },
      );
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.markMultipleAsRead');
    }
  }

  async markAllAsRead(userId: number, fromUserId: number): Promise<void> {
    try {
      await this.messagesRepository.update(
        {
          to: { id: userId },
          from: { id: fromUserId },
          read: false,
        },
        { read: true },
      );
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.markAllAsRead');
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      return await this.messagesRepository.count({
        where: {
          to: { id: userId },
          read: false,
        },
      });
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.getUnreadCount');
    }
  }

  // This function is used to get the conversation previews for a user
  // It retrieves the latest message for each unique conversation
  // and returns a limited number of these latest messages, ordered by the creation date of the latest message
  // in each conversation.
  async getChatsPreviews(userId: number, limit = 20): Promise<ChatPreview[]> {
    try {
      // This query retrieves the latest message for each unique conversation
      // involving a specific user (identified by the first parameter, $1),
      // and then returns a limited number (specified by the second parameter, $2)
      // of these latest messages, ordered by the creation date of the latest message
      // in each conversation.
      const latestMessages = await this.messagesRepository.query(
        `
        WITH RankedMessages AS (
          SELECT 
            m.*,
            ROW_NUMBER() OVER (
              PARTITION BY 
                CASE 
                  WHEN m."fromId" = $1 THEN m."toId" 
                  ELSE m."fromId" 
                END
              ORDER BY m."createdAt" DESC
            ) as rn
          FROM message m
          WHERE m."fromId" = $1 OR m."toId" = $1
        )
        SELECT * FROM RankedMessages 
        WHERE rn = 1
        ORDER BY "createdAt" DESC
        LIMIT $2
      `,
        [userId, limit],
      );

      if (!latestMessages.length) {
        return [];
      }

      // Get all conversation partners from the results
      const partnerIds = latestMessages.map((msg: any) =>
        msg.fromId === userId ? msg.toId : msg.fromId,
      );

      // Get unread counts for each conversation
      const unreadCountsQuery = await this.messagesRepository
        .createQueryBuilder('message')
        .select('message.fromId', 'fromId')
        .addSelect('COUNT(*)', 'count')
        .where('message.toId = :userId', { userId })
        .andWhere('message.read = false')
        .andWhere('message.fromId IN (:...partnerIds)', { partnerIds })
        .groupBy('message.fromId')
        .getRawMany();

      // Create a map for easy lookup
      const unreadCountMap = new Map<number, number>();
      unreadCountsQuery.forEach((row) => {
        unreadCountMap.set(row.fromId, parseInt(row.count));
      });

      // Fetch actual user data for the conversation partners using UsersService
      const userInfoMap = new Map<number, any>();

      if (partnerIds.length) {
        // Fetch all users at once with their accounts in a single query
        const users = await this.usersService.findManyByIds(partnerIds, ['account']);

        // Map user info for easier lookup
        users.forEach((user) => {
          userInfoMap.set(user.id, {
            id: user.id,
            username: user.account.username,
            avatarUrl: user.account.avatarUrl,
          });
        });
      }

      // Transform the data into the required format
      return latestMessages.map((msg: any) => {
        const partnerId = msg.fromId === userId ? msg.toId : msg.fromId;
        const partnerInfo = userInfoMap.get(partnerId);

        return {
          userId: partnerId,
          username: partnerInfo?.username || `User ${partnerId}`,
          avatarUrl: partnerInfo?.avatarUrl,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.read,
            isSentByUser: msg.fromId === userId,
          },
          unreadCount: unreadCountMap.get(partnerId) || 0,
        };
      });
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'PrivateMessagesService.getChatsPreviews');
    }
  }
}
