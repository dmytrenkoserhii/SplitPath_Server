/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from 'socket.io';

import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { WsJwtGuard } from '@/modules/auth/guards';
import { SocketAuthMiddleware } from '@/modules/auth/middlewares';

import { Friend } from '../entities';
import { FriendsService } from '../services';
import { FriendsEmitEvents } from '../types';

@WebSocketGateway({
  namespace: '/friends',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class FriendsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(FriendsGateway.name);

  constructor(private readonly friendsService: FriendsService) {}

  @WebSocketServer()
  server: Server<any, FriendsEmitEvents>;

  private userSocketMap: Map<number, string> = new Map();
  private onlineUsers: Set<number> = new Set();

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleware() as any);
    this.logger.log('Friends Gateway Initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.data.user.sub;
    this.userSocketMap.set(userId, client.id);
    this.onlineUsers.add(userId);

    this.broadcastUserStatus(userId, true);

    this.logger.log(`User ${userId} connected with socket ${client.id} to friends namespace`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user.sub;
    this.userSocketMap.delete(userId);
    this.onlineUsers.delete(userId);

    this.broadcastUserStatus(userId, false);

    this.logger.log(`User ${userId} disconnected from friends namespace`);
  }

  private async broadcastUserStatus(userId: number, isOnline: boolean) {
    const friends = await this.getFriendIds(userId);

    friends.forEach((friendId) => {
      const friendSocketId = this.userSocketMap.get(friendId);
      if (friendSocketId) {
        this.server.to(friendSocketId).emit('friend_status_changed', {
          userId,
          isOnline,
        });
      }
    });
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  private async getFriendIds(userId: number): Promise<number[]> {
    const friendsList = await this.friendsService.getFriendsList(userId, { page: 1, limit: 10000 });

    return friendsList.items.map((friend: Friend) =>
      friend.sender.id === userId ? friend.receiver.id : friend.sender.id,
    );
  }

  emitFriendRequest(friendRequest: Friend) {
    const receiverSocketId = this.userSocketMap.get(friendRequest.receiver.id);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('new_friend_request', friendRequest);
    }
  }

  emitFriendRequestAccepted(friendRequest: Friend) {
    const senderSocketId = this.userSocketMap.get(friendRequest.sender.id);
    if (senderSocketId) {
      this.server.to(senderSocketId).emit('friend_request_accepted', friendRequest);
    }
  }

  emitFriendRequestRejected(friendRequest: Friend) {
    const senderSocketId = this.userSocketMap.get(friendRequest.sender.id);
    if (senderSocketId) {
      this.server.to(senderSocketId).emit('friend_request_rejected', friendRequest);
    }
  }

  emitFriendDeleted(friend: Friend) {
    const receiverSocketId = this.userSocketMap.get(friend.receiver.id);
    const senderSocketId = this.userSocketMap.get(friend.sender.id);
    console.log('emitFriendDeleted', receiverSocketId, senderSocketId, friend);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('friend_deleted', friend);
    }
    if (senderSocketId) {
      this.server.to(senderSocketId).emit('friend_deleted', friend);
    }
  }

  emitFriendRequestResent(friendRequest: Friend) {
    const receiverSocketId = this.userSocketMap.get(friendRequest.receiver.id);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('friend_request_resent', friendRequest);
    }
  }
}
