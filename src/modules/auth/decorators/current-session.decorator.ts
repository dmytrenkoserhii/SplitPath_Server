import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';

import { JwtAccessPayload } from '../types';

export const CurrentSession = createParamDecorator(
  <T = JwtAccessPayload>(key: keyof T | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const payload = request.user as T;
    console.log('--- HERE ---', request.headers);
    console.log('--- HERE ---', request.path);

    if (!payload) {
      throw new UnauthorizedException('Request does not contain a valid JWT payload.');
    }

    return key ? payload[key] : payload;
  },
);
