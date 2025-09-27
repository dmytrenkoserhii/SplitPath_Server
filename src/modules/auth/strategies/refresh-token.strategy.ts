import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { CookiesKeys } from '@/shared/enums';

import { JwtAccessPayload, JwtRefreshPayload } from '../types';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookies (for web clients)
        (request: Request) => {
          return request?.cookies?.[CookiesKeys.REFRESH_TOKEN];
        },
        // If no cookie found, try Authorization header (for mobile/API clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  validate(req: Request, payload: JwtAccessPayload): JwtRefreshPayload {
    // Try to get refresh token from cookies first (web clients)
    let refreshToken = req?.cookies?.[CookiesKeys.REFRESH_TOKEN];

    // If no cookie found, extract from Authorization header (mobile/API clients)
    if (!refreshToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
      }
    }

    return { ...payload, refreshToken };
  }
}
