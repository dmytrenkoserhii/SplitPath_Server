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

// TODO: future reference for scaling userSocketMap and onlineUsers
// Use a Shared Store: Implement a shared store like Redis to keep track of user socket mappings and online status across all instances.
// Socket.IO Adapters: Use a Socket.IO adapter (e.g., socket.io-redis-adapter). This adapter handles message broadcasting across multiple instances automatically using the shared store (like Redis Pub/Sub). It effectively solves the problem of emitting events to users connected to different server instances.
// Refactor State Logic: Modify handleConnection, handleDisconnect, isUserOnline, and the emit... methods to interact with the shared store (e.g., Redis) instead of the in-memory Map and Set.

// TODO: future reference for broadcastUserStatus
// Targeted Emission via Rooms: Have each connected user join a Socket.IO room named after their userId (e.g., client.join(user_${userId})). When user A's status changes, fetch user A's friend IDs *once* (perhaps cached). Then, emit the status update directly to the rooms of those friends:server.to(friendIdRooms).emit('friend_status_changed', { userId: A, isOnline });(wherefriendIdRoomsis an array like['user_123', 'user_456']`). This requires an efficient way to get friend IDs.
// Pub/Sub: Use Redis Pub/Sub. When a user connects/disconnects, publish a message (user_status_update, payload: { userId, isOnline }). Each gateway instance could subscribe to updates for the users currently connected to it. This requires more complex subscription management but is very scalable.

@WebSocketGateway({
  namespace: '/friends',
  cors: {
    origin: process.env.CLIENT_URL,
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

  // TODO: improve performance
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
