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
    const cookies = client.handshake.headers.cookie;

    try {
      // Parse cookies string to get access token
      const tokenCookie = cookies
        ?.split(';')
        .find((cookie) => cookie.trim().startsWith('access_token='));
      const token = tokenCookie?.split('=')[1];

      if (!token) {
        Logger.warn('No access token found in cookies');
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
      // TODO: Handle error
      Logger.error(`WebSocket authentication failed: ${err}`);
      return false;
    }
  }

  public static verify(client: Socket) {
    const cookies = client.handshake.headers.cookie;

    try {
      // Parse cookies string to get access token
      const tokenCookie = cookies
        ?.split(';')
        .find((cookie) => cookie.trim().startsWith('access_token='));
      const token = tokenCookie?.split('=')[1];

      if (!token) {
        Logger.warn('No access token found in cookies');
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
