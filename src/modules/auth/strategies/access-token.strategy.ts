import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { CookiesKeys } from '@/shared/enums';

import { JwtAccessPayload } from '../types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.[CookiesKeys.ACCESS_TOKEN];
        },
      ]),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtAccessPayload): JwtAccessPayload {
    return payload;
  }
}
