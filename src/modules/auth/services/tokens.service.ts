import * as bcrypt from 'bcrypt';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User } from '@/modules/users/entities';
import { Role } from '@/modules/users/enums';
import { UsersService } from '@/modules/users/services';
import { ENV } from '@/shared/enums';

import { Tokens } from '../types';

@Injectable()
export class TokensService {
  private readonly jwtAccessSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtAccessTokenExpirationTime: string;
  private readonly jwtRefreshTokenExpirationTime: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.jwtAccessSecret = this.configService.get<string>(ENV.JWT_ACCESS_SECRET, '');
    this.jwtRefreshSecret = this.configService.get<string>(ENV.JWT_REFRESH_SECRET, '');
    this.jwtAccessTokenExpirationTime = this.configService.get<string>(
      ENV.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      '',
    );
    this.jwtRefreshTokenExpirationTime = this.configService.get<string>(
      ENV.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
      '',
    );
  }

  public async createTokens(user: User): Promise<Tokens> {
    const accessToken = await this.createAccessToken(
      user.id,
      user.email,
      user.role,
      user.isEmailVerified,
    );

    const refreshToken = await this.createRefreshToken(
      user.id,
      user.email,
      user.role,
      user.isEmailVerified,
    );

    return { accessToken, refreshToken };
  }

  public async refreshTokens(
    userId: number,
    refreshToken: string,
  ): Promise<{ tokens: Tokens; user: User }> {
    const user = await this.usersService.findOneById(userId, [], ['refreshToken']);
    if (!user || !user.refreshToken) {
      throw new Error('User not found, or refresh token missing');
    }

    const isValid = await this.verifyRefreshToken(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new Error('Refresh token is invalid');
    }

    const tokens = await this.createTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  public async removeRefreshToken(userId: number): Promise<void> {
    await this.usersService.update(userId, { refreshToken: null });
  }

  public async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  private async createAccessToken(
    userId: number,
    email: string,
    role: Role,
    isEmailVerified: boolean,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email, role, isEmailVerified },
      {
        secret: this.jwtAccessSecret,
        expiresIn: this.jwtAccessTokenExpirationTime,
      },
    );
  }

  private async createRefreshToken(
    userId: number,
    email: string,
    role: Role,
    isEmailVerified: boolean,
  ): Promise<string> {
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, role, isEmailVerified },
      {
        secret: this.jwtRefreshSecret,
        expiresIn: this.jwtRefreshTokenExpirationTime,
      },
    );

    await this.storeRefreshToken(userId, refreshToken);
    return refreshToken;
  }

  private async verifyRefreshToken(providedToken: string, storedToken: string): Promise<boolean> {
    return bcrypt.compare(providedToken, storedToken);
  }
}
