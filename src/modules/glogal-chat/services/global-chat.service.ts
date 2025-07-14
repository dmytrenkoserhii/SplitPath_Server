import { Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersService } from '@/modules/users/services';
import { PaginatedResponse } from '@/shared/types';
import { ErrorHandler } from '@/shared/utils';

import { CreateGlobalChatMessageDto } from '../dtos';
import { GlobalChatMessage } from '../entities';

@Injectable()
export class GlobalChatService {
  private readonly logger = new Logger(GlobalChatService.name);

  constructor(
    @InjectRepository(GlobalChatMessage)
    private readonly globalChatMessageRepository: Repository<GlobalChatMessage>,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('Global chat service initialized');
  }

  async findAllMessages(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<GlobalChatMessage>> {
    try {
      const [messages, total] = await this.globalChatMessageRepository.findAndCount({
        order: { createdAt: 'DESC' },
        relations: ['from', 'from.account'],
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        items: messages,
        meta: {
          total,
          currentPage: page,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'GlobalChatService.findAll');
    }
  }

  async createMessage(
    fromUserId: number,
    createMessageDto: CreateGlobalChatMessageDto,
  ): Promise<GlobalChatMessage> {
    try {
      const message = await this.globalChatMessageRepository.save({
        from: { id: fromUserId },
        content: createMessageDto.content,
      });

      return this.globalChatMessageRepository.findOne({
        where: { id: message.id },
        relations: ['from', 'from.account'],
      }) as Promise<GlobalChatMessage>;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'GlobalChatService.createMessage');
    }
  }
}
