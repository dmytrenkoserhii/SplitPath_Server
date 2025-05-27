import * as bcrypt from 'bcrypt';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { User } from '@/modules/users/entities';
import { Role } from '@/modules/users/enums';
import { UsersService } from '@/modules/users/services';
import { ENV } from '@/shared/enums';
import { ErrorHandler } from '@/shared/utils';

import { Tokens } from '../types';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
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
    try {
      this.logger.debug(`Creating token pair for user: ${user.id}`);

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

      this.logger.debug(`Token pair created successfully for user: ${user.id}`);
      return { accessToken, refreshToken };
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'TokensService.createTokens');
    }
  }

  public async refreshTokens(
    userId: number,
    refreshToken: string,
  ): Promise<{ tokens: Tokens; user: User }> {
    try {
      this.logger.debug(`Attempting to refresh tokens for user: ${userId}`);

      const user = await this.usersService.findOneById(userId, [], ['refreshToken']);
      if (!user || !user.refreshToken) {
        this.logger.warn(
          `Token refresh failed - user not found or refresh token missing: ${userId}`,
        );
        throw new Error('User not found, or refresh token missing');
      }

      const isValid = await this.verifyRefreshToken(refreshToken, user.refreshToken);
      if (!isValid) {
        this.logger.warn(`Token refresh failed - invalid refresh token for user: ${userId}`);
        throw new Error('Refresh token is invalid');
      }

      const tokens = await this.createTokens(user);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      this.logger.debug(`Tokens refreshed successfully for user: ${userId}`);
      return { user, tokens };
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'TokensService.refreshTokens');
    }
  }

  public async removeRefreshToken(userId: number): Promise<void> {
    try {
      this.logger.debug(`Removing refresh token for user: ${userId}`);
      await this.usersService.update(userId, { refreshToken: null });
      this.logger.debug(`Refresh token removed successfully for user: ${userId}`);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'TokensService.removeRefreshToken');
    }
  }

  public async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    try {
      this.logger.debug(`Storing new refresh token for user: ${userId}`);
      const salt = await bcrypt.genSalt();
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
      await this.usersService.update(userId, {
        refreshToken: hashedRefreshToken,
      });
      this.logger.debug(`Refresh token stored successfully for user: ${userId}`);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'TokensService.storeRefreshToken');
    }
  }

  private async createAccessToken(
    userId: number,
    email: string,
    role: Role,
    isEmailVerified: boolean,
  ): Promise<string> {
    try {
      this.logger.debug(`Creating access token for user: ${userId}`);
      const token = await this.jwtService.signAsync(
        { sub: userId, email, role, isEmailVerified },
        {
          secret: this.jwtAccessSecret,
          expiresIn: this.jwtAccessTokenExpirationTime,
        },
      );
      this.logger.debug(`Access token created successfully for user: ${userId}`);
      return token;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'TokensService.createAccessToken');
    }
  }

  private async createRefreshToken(
    userId: number,
    email: string,
    role: Role,
    isEmailVerified: boolean,
  ): Promise<string> {
    try {
      this.logger.debug(`Creating refresh token for user: ${userId}`);
      const refreshToken = await this.jwtService.signAsync(
        { sub: userId, email, role, isEmailVerified },
        {
          secret: this.jwtRefreshSecret,
          expiresIn: this.jwtRefreshTokenExpirationTime,
        },
      );

      await this.storeRefreshToken(userId, refreshToken);
      this.logger.debug(`Refresh token created successfully for user: ${userId}`);
      return refreshToken;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'TokensService.createRefreshToken');
    }
  }

  private async verifyRefreshToken(providedToken: string, storedToken: string): Promise<boolean> {
    try {
      this.logger.debug('Verifying refresh token');
      const isValid = await bcrypt.compare(providedToken, storedToken);
      if (!isValid) {
        this.logger.warn('Refresh token verification failed');
      }
      return isValid;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'TokensService.verifyRefreshToken');
    }
  }
}
