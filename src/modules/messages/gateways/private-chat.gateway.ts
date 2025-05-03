import { Server, Socket } from 'socket.io';

import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { WsJwtGuard } from '@/modules/auth/guards';
import { SocketAuthMiddleware } from '@/modules/auth/middlewares';
import { ErrorHandler } from '@/shared/utils';

import { Message } from '../entities';
import { PrivateMessagesService } from '../services';
import {
  MessageReadPayload,
  PrivateChatEmitEvents,
  SendPrivateMessagePayload,
  TypingStatusChangePayload,
} from '../types';

@WebSocketGateway({
  namespace: 'private-chat',
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class PrivateChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private server: Server<any, PrivateChatEmitEvents>;
  private readonly logger = new Logger(PrivateChatGateway.name);
  private userSocketMap: Map<string, Socket> = new Map();

  constructor(private readonly privateMessagesService: PrivateMessagesService) {}

  afterInit() {
    this.server.use(SocketAuthMiddleware());
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.sub;
    this.userSocketMap.set(userId.toString(), client);
    this.logger.log(`Client connected: ${userId}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.sub;
    this.userSocketMap.delete(userId.toString());
    this.logger.log(`Client disconnected: ${userId}`);
  }

  async notifyNewMessage(message: Message) {
    const privateMessage = {
      id: message.id.toString(),
      content: message.content,
      senderId: message.from.id.toString(),
      receiverId: message.to.id.toString(),
      createdAt: message.createdAt,
    };

    // Notify sender
    const senderSocket = this.userSocketMap.get(message.from.id.toString());
    if (senderSocket) {
      senderSocket.emit('new_private_message', privateMessage);
    }

    // Notify receiver
    const receiverSocket = this.userSocketMap.get(message.to.id.toString());
    if (receiverSocket) {
      receiverSocket.emit('new_private_message', privateMessage);
    }
  }

  async notifyMessageRead(message: Message, readerUserId: number) {
    const readStatus = {
      messageId: message.id.toString(),
      userId: readerUserId.toString(),
      readAt: new Date(),
    };

    // Notify the reader if they're online
    const readerSocket = this.userSocketMap.get(readerUserId.toString());
    if (readerSocket) {
      readerSocket.emit('message_read', readStatus);
    }

    // Notify the sender if they're online
    const senderSocket = this.userSocketMap.get(message.from.id.toString());
    if (senderSocket && message.from.id !== readerUserId) {
      senderSocket.emit('message_read', readStatus);
    }
  }

  @SubscribeMessage('typing_status_change')
  async handleTypingStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingStatusChangePayload,
  ) {
    try {
      const userId = client.data.user.sub;
      const typingStatus = {
        userId: userId.toString(),
        receiverId: payload.receiverId,
        isTyping: payload.isTyping,
      };

      // Emit typing status to receiver if online
      const receiverSocket = this.userSocketMap.get(payload.receiverId);
      if (receiverSocket) {
        receiverSocket.emit('typing_status', typingStatus);
      }
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'Failed to update typing status');
    }
  }
}
