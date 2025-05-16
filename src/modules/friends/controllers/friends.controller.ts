import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';
import { AccessTokenGuard } from '@/modules/auth/guards';
import { PaginatedResponse } from '@/shared/types';
import { WebSocketErrorHandler } from '@/shared/utils';

import { CreateFriendRequestDto, GetFriendRequestsDto } from '../dtos';
import { Friend } from '../entities';
import { FriendsGateway } from '../gateways';
import { FriendsService } from '../services';

@ApiTags('Friends')
@Controller('friends')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class FriendsController {
  private readonly logger = new Logger(FriendsController.name);

  constructor(
    private readonly friendsService: FriendsService,
    private readonly friendsGateway: FriendsGateway,
  ) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201, type: Friend })
  async sendFriendRequest(
    @Body() createFriendRequestDto: CreateFriendRequestDto,
    @CurrentSession('sub') sub: number,
  ): Promise<Friend> {
    const friendRequest = await this.friendsService.sendFriendRequest(sub, createFriendRequestDto);

    WebSocketErrorHandler.handle(
      () => this.friendsGateway.emitFriendRequest(friendRequest),
      'emit.friendRequest',
      friendRequest.receiver.id,
      this.logger,
    );

    return friendRequest;
  }

  @Post('accept/:requestId')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({ status: 200, type: Friend })
  async acceptFriendRequest(
    @Param('requestId') requestId: number,
    @CurrentSession('sub') sub: number,
  ): Promise<Friend> {
    const acceptedRequest = await this.friendsService.acceptFriendRequest(sub, requestId);

    WebSocketErrorHandler.handle(
      () => this.friendsGateway.emitFriendRequestAccepted(acceptedRequest),
      'emit.friendRequestAccepted',
      acceptedRequest.sender.id,
      this.logger,
    );

    return acceptedRequest;
  }

  @Post('reject/:requestId')
  @ApiOperation({ summary: 'Reject a friend request' })
  @ApiResponse({ status: 200, type: Friend })
  async rejectFriendRequest(
    @Param('requestId') requestId: number,
    @CurrentSession('sub') sub: number,
  ): Promise<Friend> {
    const rejectedRequest = await this.friendsService.rejectFriendRequest(sub, requestId);

    WebSocketErrorHandler.handle(
      () => this.friendsGateway.emitFriendRequestRejected(rejectedRequest),
      'emit.friendRequestRejected',
      rejectedRequest.sender.id,
      this.logger,
    );

    return rejectedRequest;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a friend' })
  @ApiResponse({ status: 200, type: Friend })
  async deleteFriend(@Param('id') id: number, @CurrentSession('sub') sub: number): Promise<Friend> {
    const deletedFriend = await this.friendsService.deleteFriend(sub, id);
    const otherUserId =
      deletedFriend.sender.id === sub ? deletedFriend.receiver.id : deletedFriend.sender.id;

    WebSocketErrorHandler.handle(
      () => this.friendsGateway.emitFriendDeleted({ ...deletedFriend, id: +id }),
      'emit.friendDeleted',
      otherUserId,
      this.logger,
    );

    return deletedFriend;
  }

  @Get('')
  @ApiOperation({ summary: 'Get friends list' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getFriendsList(
    @CurrentSession('sub') sub: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    return this.friendsService.getFriendsList(sub, { page, limit });
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get friend requests with optional status and direction filters' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getFriendRequests(
    @CurrentSession('sub') sub: number,
    @Query() query: GetFriendRequestsDto,
  ): Promise<PaginatedResponse<Friend>> {
    return this.friendsService.getFriendRequests(sub, query);
  }

  @Get('online-status')
  @ApiOperation({ summary: 'Get online status of friends' })
  async getFriendsOnlineStatus(
    @CurrentSession('sub') sub: number,
  ): Promise<{ [key: number]: boolean }> {
    const friendsList = await this.friendsService.getFriendsList(sub, {
      page: 1,
      limit: 200,
    });

    const onlineStatus: { [key: number]: boolean } = {};

    friendsList.items.forEach((friend: Friend) => {
      const friendId = friend.sender.id === sub ? friend.receiver.id : friend.sender.id;
      onlineStatus[friendId] = this.friendsGateway.isUserOnline(friendId);
    });

    return onlineStatus;
  }

  @Post('resend/:requestId')
  @ApiOperation({ summary: 'Resend a friend request' })
  @ApiResponse({ status: 200, type: Friend })
  async resendFriendRequest(
    @Param('requestId') requestId: number,
    @CurrentSession('sub') sub: number,
  ): Promise<Friend> {
    const resentRequest = await this.friendsService.resendFriendRequest(sub, requestId);

    WebSocketErrorHandler.handle(
      () => this.friendsGateway.emitFriendRequestResent(resentRequest),
      'emit.friendRequestResent',
      resentRequest.receiver.id,
      this.logger,
    );

    return resentRequest;
  }
}
