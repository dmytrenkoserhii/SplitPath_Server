import { Response } from 'express';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { ForgotPasswordDto, ResetPasswordDto } from '@/modules/users/dtos';
import { User } from '@/modules/users/entities';
import { AccountService, UsersService, VerificationService } from '@/modules/users/services';
import { CookiesKeys, TimePeriods } from '@/shared/enums';
import { CookiesService } from '@/shared/services';
import { ErrorHandler } from '@/shared/utils';

import { SignInDto, SignUpDto } from '../dtos';
import { Tokens } from '../types';
import { TokensService } from './tokens.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly cookiesService: CookiesService,
    private readonly verificationService: VerificationService,
    private readonly accountService: AccountService,
  ) {}

  public async signUp(signUpDto: SignUpDto): Promise<{ user: User; tokens: Tokens }> {
    try {
      this.logger.log(`Starting signup process for email: ${signUpDto.email}`);

      const userExists = await this.usersService.findOneByEmail(signUpDto.email);
      if (userExists) {
        throw new BadRequestException('User with this email already exists');
      }

      const usernameExists = await this.accountService.findOneByUsername(signUpDto.username);
      if (usernameExists) {
        throw new BadRequestException('Username is already taken');
      }

      const newUser = await this.usersService.create(signUpDto);
      await this.verificationService.sendVerificationLink(newUser.id);

      const tokens = await this.generateAndStoreTokens(newUser);
      this.logger.log(`Signup completed successfully for user: ${newUser.id}`);

      return { user: newUser, tokens };
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AuthService.signUp');
    }
  }

  public async signIn(signInDto: SignInDto): Promise<{ user: User; tokens: Tokens }> {
    try {
      this.logger.log(`Starting signin process for: ${signInDto.email}`);

      const user = await this.usersService.validateUser(signInDto.email, signInDto.password);
      const tokens = await this.generateAndStoreTokens(user);

      this.logger.log(`Signin completed successfully for user: ${user.id}`);
      return { user, tokens };
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AuthService.signIn');
    }
  }

  public async logout(id: number): Promise<void> {
    try {
      this.logger.log(`Starting logout process for user: ${id}`);
      await this.tokensService.removeRefreshToken(id);
      this.logger.log(`Logout completed successfully for user: ${id}`);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AuthService.logout');
    }
  }

  private async generateAndStoreTokens(user: User): Promise<Tokens> {
    try {
      this.logger.debug(`Generating tokens for user: ${user.id}`);
      const tokens = await this.tokensService.createTokens(user);
      await this.tokensService.storeRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AuthService.generateAndStoreTokens');
    }
  }

  public async sendPasswordResetEmail(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    try {
      this.logger.log(`Initiating password reset process for: ${forgotPasswordDto.email}`);
      await this.usersService.sendPasswordResetEmail(forgotPasswordDto);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AuthService.sendPasswordResetEmail');
    }
  }

  public async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      this.logger.log('Initiating password reset with token');
      await this.usersService.resetPassword(resetPasswordDto);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AuthService.resetPassword');
    }
  }

  public setAuthCookies(res: Response, tokens: Tokens) {
    try {
      this.logger.debug('Setting authentication cookies');
      this.cookiesService.setCookie(
        res,
        CookiesKeys.ACCESS_TOKEN,
        tokens.accessToken,
        TimePeriods.HOUR,
      );
      this.cookiesService.setCookie(
        res,
        CookiesKeys.REFRESH_TOKEN,
        tokens.refreshToken,
        TimePeriods.WEEK,
      );
      this.logger.debug('Authentication cookies set successfully');
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AuthService.setAuthCookies');
    }
  }
}
