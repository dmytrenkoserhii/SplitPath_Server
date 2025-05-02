import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PaginatedResponse } from '@/shared/types';

// import { CurrentSession } from '@/modules/auth/decorators/current-session.decorator';
// import { AccessTokenGuard } from '@/modules/auth/guards/access-token.guard';
// import { JwtAccessPayload } from '@/modules/auth/types/jwt-access-payload.interface';

import { CreateFriendRequestDto } from '../dtos';
import { Friend } from '../entities';
import { FriendsGateway } from '../gateways';
import { FriendsService } from '../services';

@ApiTags('Friends')
@Controller('friends')
@ApiBearerAuth()
// @UseGuards(AccessTokenGuard)
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
    // @CurrentSession() session: JwtAccessPayload,
  ): Promise<Friend> {
    const session = { sub: 1 };
    const friendRequest = await this.friendsService.sendFriendRequest(
      session.sub,
      createFriendRequestDto,
    );

    this.friendsGateway.emitFriendRequest(friendRequest);
    return friendRequest;
  }

  @Post('accept/:requestId')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({ status: 200, type: Friend })
  async acceptFriendRequest(
    @Param('requestId') requestId: number,
    // @CurrentSession() session: JwtAccessPayload,
  ): Promise<Friend> {
    const session = { sub: 1 };
    const acceptedRequest = await this.friendsService.acceptFriendRequest(session.sub, requestId);

    this.friendsGateway.emitFriendRequestAccepted(acceptedRequest);
    return acceptedRequest;
  }

  @Post('reject/:requestId')
  @ApiOperation({ summary: 'Reject a friend request' })
  @ApiResponse({ status: 200, type: Friend })
  async rejectFriendRequest(
    @Param('requestId') requestId: number,
    // @CurrentSession() session: JwtAccessPayload,
  ): Promise<Friend> {
    const session = { sub: 1 };
    const rejectedRequest = await this.friendsService.rejectFriendRequest(session.sub, requestId);

    this.friendsGateway.emitFriendRequestRejected(rejectedRequest);
    return rejectedRequest;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a friend' })
  @ApiResponse({ status: 200, type: Friend })
  async deleteFriend(
    @Param('id') id: number,
    // @CurrentSession() session: JwtAccessPayload,
  ): Promise<Friend> {
    const session = { sub: 1 };
    const deletedFriend = await this.friendsService.deleteFriend(session.sub, id);

    this.friendsGateway.emitFriendDeleted({ ...deletedFriend, id: +id });
    return deletedFriend;
  }

  @Get('')
  @ApiOperation({ summary: 'Get friends list' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getFriendsList(
    // @CurrentSession() session: JwtAccessPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    const session = { sub: 1 };
    return this.friendsService.getFriendsList(session.sub, { page, limit });
  }

  @Get('pending/incoming')
  @ApiOperation({ summary: 'Get incoming friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getIncomingRequests(
    // @CurrentSession() session: JwtAccessPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    const session = { sub: 1 };
    return this.friendsService.getPendingIncomingRequests(session.sub, { page, limit });
  }

  @Get('pending/outgoing')
  @ApiOperation({ summary: 'Get outgoing friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getOutgoingRequests(
    // @CurrentSession() session: JwtAccessPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    const session = { sub: 1 };
    return this.friendsService.getPendingOutgoingRequests(session.sub, { page, limit });
  }

  @Get('rejected/incoming')
  @ApiOperation({ summary: 'Get rejected friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getRejectedIncomingRequests(
    // @CurrentSession() session: JwtAccessPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    const session = { sub: 1 };
    return this.friendsService.getRejectedIncomingRequests(session.sub, { page, limit });
  }

  @Get('rejected/outgoing')
  @ApiOperation({ summary: 'Get rejected outgoing friend requests' })
  @ApiResponse({ status: 200, type: [Friend] })
  async getRejectedOutgoingRequests(
    // @CurrentSession() session: JwtAccessPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<Friend>> {
    const session = { sub: 1 };
    return this.friendsService.getRejectedOutgoingRequests(session.sub, { page, limit });
  }

  @Get('online-status')
  @ApiOperation({ summary: 'Get online status of friends' })
  async getFriendsOnlineStatus() // @CurrentSession() session: JwtAccessPayload,
  : Promise<{ [key: number]: boolean }> {
    const session = { sub: 1 };
    const friendsList = await this.friendsService.getFriendsList(session.sub, {
      page: 1,
      limit: 1000,
    });

    const onlineStatus: { [key: number]: boolean } = {};

    friendsList.items.forEach((friend: Friend) => {
      const friendId = friend.sender.id === session.sub ? friend.receiver.id : friend.sender.id;
      onlineStatus[friendId] = this.friendsGateway.isUserOnline(friendId);
    });

    return onlineStatus;
  }

  @Post('resend/:requestId')
  @ApiOperation({ summary: 'Resend a friend request' })
  @ApiResponse({ status: 200, type: Friend })
  async resendFriendRequest(
    @Param('requestId') requestId: number,
    // @CurrentSession() session: JwtAccessPayload,
  ): Promise<Friend> {
    const session = { sub: 1 };
    const resentRequest = await this.friendsService.resendFriendRequest(session.sub, requestId);

    this.friendsGateway.emitFriendRequestResent(resentRequest);
    return resentRequest;
  }
}
