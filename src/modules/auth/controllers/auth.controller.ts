import { Response } from 'express';

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CookiesKeys, TimePeriods } from '@/shared/enums';
import { CookiesService } from '@/shared/services';

import { CurrentSession } from '../decorators';
import { SignInDto, SignUpDto } from '../dtos';
import { AccessTokenGuard, LocalAuthGuard, RefreshTokenGuard } from '../guards';
import { AuthService, TokenService } from '../services';
import { JwtAccessPayload, JwtRefreshPayload } from '../types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookiesService: CookiesService,
    private readonly tokenService: TokenService,
  ) {}

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully signed up' })
  @ApiBody({ type: SignUpDto })
  @HttpCode(HttpStatus.CREATED)
  @Post('sign-up')
  public async signUp(@Body() signUpDto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.signUp(signUpDto);
    this.setAuthCookies(res, response.tokens);
    return { user: response.user };
  }

  @ApiOperation({ summary: 'Sign in an existing user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully signed in' })
  @ApiBody({ type: SignInDto })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  public async signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.signIn(signInDto);
    this.setAuthCookies(res, response.tokens);
    return { user: response.user };
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens successfully refreshed' })
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get('refresh')
  public async refreshTokens(
    @CurrentSession() session: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.tokenService.refreshTokens(session.sub, session.refreshToken);
    this.setAuthCookies(res, response.tokens);
    return { user: response.user };
  }

  @ApiOperation({ summary: 'Logout the current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged out' })
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get('logout')
  public async logout(
    @CurrentSession() session: JwtAccessPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(session.sub);
    this.cookiesService.removeCookie(res, CookiesKeys.ACCESS_TOKEN);
    this.cookiesService.removeCookie(res, CookiesKeys.REFRESH_TOKEN);
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
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
  }
}
