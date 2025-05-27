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
import { MessageReadPayload, PrivateChatEmitEvents, TypingStatusChangePayload } from '../types';

@WebSocketGateway({
  namespace: 'private-chats',
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class PrivateChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private server: Server<any, PrivateChatEmitEvents>;
  private readonly logger = new Logger(PrivateChatsGateway.name);
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
    // Notify sender
    const senderSocket = this.userSocketMap.get(message.from.id.toString());
    if (senderSocket) {
      senderSocket.emit('new_private_message', message);
    }

    // Notify receiver
    const receiverSocket = this.userSocketMap.get(message.to.id.toString());
    if (receiverSocket) {
      receiverSocket.emit('new_private_message', message);
    }
  }

  async notifyMessagesRead(messages: Message[], readerUserId: number) {
    const readStatuses: MessageReadPayload[] = messages.map((message) => ({
      messageId: message.id,
      userId: readerUserId,
      readAt: new Date(),
    }));

    // TODO
    // Collect unique sender IDs to notify them
    const uniqueSenderIds = new Set<string>();
    messages.forEach((message) => {
      if (message.from.id !== readerUserId) {
        uniqueSenderIds.add(message.from.id.toString());
      }
    });

    const readerSocket = this.userSocketMap.get(readerUserId.toString());
    if (readerSocket) {
      readerSocket.emit('messages_read', readStatuses);
    }

    for (const senderId of uniqueSenderIds) {
      const senderSocket = this.userSocketMap.get(senderId);
      if (senderSocket) {
        senderSocket.emit('messages_read', readStatuses);
      }
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
        userId,
        ...payload,
      };

      const receiverSocket = this.userSocketMap.get(payload.receiverId.toString());
      if (receiverSocket) {
        receiverSocket.emit('typing_status', typingStatus);
      }
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'Failed to update typing status');
    }
  }
}
