import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  public static staticJwtService: JwtService;
  constructor(jwtService: JwtService) {
    WsJwtGuard.staticJwtService = jwtService;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') {
      return true;
    }

    const client: Socket = context.switchToWs().getClient();

    try {
      let token: string | undefined;

      // First try to extract from cookies (for web clients)
      const cookies = client.handshake.headers.cookie;
      if (cookies) {
        const tokenCookie = cookies
          ?.split(';')
          .find((cookie) => cookie.trim().startsWith('access_token='));
        token = tokenCookie?.split('=')[1];
      }

      // If no cookie found, try Authorization header (for mobile/API clients)
      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        Logger.warn('No access token found in cookies or Authorization header');
        return false;
      }

      // Verify the JWT token
      const payload = WsJwtGuard.staticJwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Attach user to socket
      client.data.user = payload;

      return true;
    } catch (err) {
      Logger.error(`WebSocket authentication failed: ${err}`);
      return false;
    }
  }

  public static verify(client: Socket) {
    try {
      let token: string | undefined;

      // First try to extract from cookies (for web clients)
      const cookies = client.handshake.headers.cookie;
      if (cookies) {
        const tokenCookie = cookies
          ?.split(';')
          .find((cookie) => cookie.trim().startsWith('access_token='));
        token = tokenCookie?.split('=')[1];
      }

      // If no cookie found, try Authorization header (for mobile/API clients)
      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        Logger.warn('No access token found in cookies or Authorization header');
        return false;
      }

      // Verify the JWT token
      const payload = WsJwtGuard.staticJwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Attach user to socket
      client.data.user = payload;

      return true;
    } catch {
      return false;
    }
  }
}
