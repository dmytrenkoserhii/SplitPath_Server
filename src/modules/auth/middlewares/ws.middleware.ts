import { Socket } from 'socket.io';

import { WsJwtGuard } from '../guards/ws-jwt-auth.guard';

type SocketIOMiddleware = {
  (client: Socket, next: (err?: Error) => void): void;
};

export const SocketAuthMiddleware = (): SocketIOMiddleware => {
  return (client, next) => {
    try {
      const isAuthenticated = WsJwtGuard.verify(client);
      if (!isAuthenticated) {
        next(new Error('Unauthorized'));
        return;
      }
      next();
    } catch (error: unknown) {
      next(error as Error);
    }
  };
};
