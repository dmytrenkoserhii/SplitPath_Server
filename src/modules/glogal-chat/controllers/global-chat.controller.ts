import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';
import { AccessTokenGuard } from '@/modules/auth/guards';
import { PaginatedResponse } from '@/shared/types';
import { WebSocketErrorHandler } from '@/shared/utils';

import { CreateGlobalChatMessageDto } from '../dtos';
import { GlobalChatMessage } from '../entities';
import { GlobalChatGateway } from '../gateways';
import { GlobalChatService } from '../services';

@ApiTags('Global Chat')
@Controller('global-chat')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class GlobalChatController {
  private readonly logger = new Logger(GlobalChatController.name);

  constructor(
    private readonly globalChatService: GlobalChatService,
    private readonly globalChatGateway: GlobalChatGateway,
  ) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get global chat messages with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated global chat messages',
  })
  async getMessages(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<PaginatedResponse<GlobalChatMessage>> {
    return this.globalChatService.findAllMessages(page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create new global chat message' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Global chat message created successfully',
  })
  async createMessage(
    @CurrentSession('sub') sub: number,
    @Body() createMessageDto: CreateGlobalChatMessageDto,
  ): Promise<GlobalChatMessage> {
    const message = await this.globalChatService.createMessage(sub, createMessageDto);

    WebSocketErrorHandler.handle(
      () => this.globalChatGateway.notifyNewMessage(message),
      'emit.newGlobalMessage',
      sub,
      this.logger,
    );

    return message;
  }
}
