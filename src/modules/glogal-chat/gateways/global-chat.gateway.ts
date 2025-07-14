import { Server, Socket } from 'socket.io';

import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { WsJwtGuard } from '@/modules/auth/guards';
import { SocketAuthMiddleware } from '@/modules/auth/middlewares';

import { GlobalChatMessage } from '../entities';
import { GlobalChatService } from '../services';
import { GlobalChatEmitEvents } from '../types';

@WebSocketGateway({
  namespace: 'global-chat',
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class GlobalChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server<any, GlobalChatEmitEvents>;
  private readonly logger = new Logger(GlobalChatGateway.name);
  private userSocketMap: Map<string, Socket> = new Map();

  constructor(private readonly globalChatService: GlobalChatService) {}

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

  async notifyNewMessage(message: GlobalChatMessage) {
    this.server.emit('new_global_message', message);
  }
}
