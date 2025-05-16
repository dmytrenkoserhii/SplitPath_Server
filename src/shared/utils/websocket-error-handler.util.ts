import { Logger } from '@nestjs/common';

import { ErrorHandler } from './error-handler.util';

export class WebSocketErrorHandler {
  static handle<T>(func: () => T, eventName: string, userId: number, logger: Logger): T {
    try {
      return func();
    } catch (error: unknown) {
      ErrorHandler.handle(error, logger, `WebSocket ${eventName} for user ${userId}`);
    }
  }
}
