import { Response } from 'express';

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CookiesKeys, ENV } from '@/shared/enums';
import { CookiesService } from '@/shared/services';

import { CurrentSession } from '../decorators';
import { SignInDto, SignUpDto } from '../dtos';
import { AccessTokenGuard, GoogleOAuthGuard, LocalAuthGuard, RefreshTokenGuard } from '../guards';
import { AuthService, TokensService } from '../services';
import { GoogleAuthPayload, JwtRefreshPayload } from '../types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookiesService: CookiesService,
    private readonly tokensService: TokensService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully signed up' })
  @ApiBody({ type: SignUpDto })
  @HttpCode(HttpStatus.CREATED)
  @Post('sign-up')
  public async signUp(@Body() signUpDto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    const signUpResult = await this.authService.signUp(signUpDto);
    this.authService.setAuthCookies(res, signUpResult.tokens);
    return { user: signUpResult.user };
  }

  @ApiOperation({ summary: 'Sign in an existing user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully signed in' })
  @ApiBody({ type: SignInDto })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  public async signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const signInResult = await this.authService.signIn(signInDto);
    this.authService.setAuthCookies(res, signInResult.tokens);
    return { user: signInResult.user };
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
    const refreshResult = await this.tokensService.refreshTokens(session.sub, session.refreshToken);
    this.authService.setAuthCookies(res, refreshResult.tokens);
    return { user: refreshResult.user };
  }

  @ApiOperation({ summary: 'Logout the current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged out' })
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get('logout')
  public async logout(
    @CurrentSession('sub') sub: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(sub);
    this.cookiesService.removeCookie(res, CookiesKeys.ACCESS_TOKEN);
    this.cookiesService.removeCookie(res, CookiesKeys.REFRESH_TOKEN);
  }

  @ApiOperation({ summary: 'Authenticate with Google' })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Redirect to Google authentication' })
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  public async googleAuth() {}

  @ApiOperation({ summary: 'Google authentication callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated with Google',
  })
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(
    @CurrentSession() session: GoogleAuthPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientUrl = this.configService.get<string>(`${ENV.CLIENT_URL}`);

    this.authService.setAuthCookies(res, session);
    res.redirect(`${clientUrl}/auth/sign-in`);
  }
}
