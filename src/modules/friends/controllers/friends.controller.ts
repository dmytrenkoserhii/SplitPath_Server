import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';
import { AccessTokenGuard } from '@/modules/auth/guards';
import { PaginatedResponse } from '@/shared/types';

import { CreateFriendRequestDto } from '../dtos';
import { Friend } from '../entities';
import { FriendsGateway } from '../gateways';
import { FriendsService } from '../services';

@ApiTags('Friends')
@Controller('friends')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class FriendsController {
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

    this.friendsGateway.emitFriendRequest(friendRequest);
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

    this.friendsGateway.emitFriendRequestAccepted(acceptedRequest);
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

    this.friendsGateway.emitFriendRequestRejected(rejectedRequest);
    return rejectedRequest;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a friend' })
  @ApiResponse({ status: 200, type: Friend })
  async deleteFriend(@Param('id') id: number, @CurrentSession('sub') sub: number): Promise<Friend> {
    const deletedFriend = await this.friendsService.deleteFriend(sub, id);

    this.friendsGateway.emitFriendDeleted({ ...deletedFriend, id: +id });
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

  @Get('pending/incoming')
  @ApiOperation({ summary: 'Get incoming friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getIncomingRequests(
    @CurrentSession('sub') sub: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    return this.friendsService.getPendingIncomingRequests(sub, { page, limit });
  }

  @Get('pending/outgoing')
  @ApiOperation({ summary: 'Get outgoing friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getOutgoingRequests(
    @CurrentSession('sub') sub: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    return this.friendsService.getPendingOutgoingRequests(sub, { page, limit });
  }

  @Get('rejected/incoming')
  @ApiOperation({ summary: 'Get rejected friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getRejectedIncomingRequests(
    @CurrentSession('sub') sub: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    return this.friendsService.getRejectedIncomingRequests(sub, { page, limit });
  }

  @Get('rejected/outgoing')
  @ApiOperation({ summary: 'Get rejected outgoing friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getRejectedOutgoingRequests(
    @CurrentSession('sub') sub: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    return this.friendsService.getRejectedOutgoingRequests(sub, { page, limit });
  }

  @Get('online-status')
  @ApiOperation({ summary: 'Get online status of friends' })
  async getFriendsOnlineStatus(
    @CurrentSession('sub') sub: number,
  ): Promise<{ [key: number]: boolean }> {
    const friendsList = await this.friendsService.getFriendsList(sub, {
      page: 1,
      limit: 1000,
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

    this.friendsGateway.emitFriendRequestResent(resentRequest);
    return resentRequest;
  }
}
