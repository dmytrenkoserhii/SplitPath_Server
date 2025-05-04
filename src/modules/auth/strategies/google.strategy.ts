import { Strategy, StrategyOptions, VerifyCallback } from 'passport-google-oauth20';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { AccountService } from '@/modules/users/services/account.service';
import { UsersService } from '@/modules/users/services/users.service';
import { ENV } from '@/shared/enums/env.enum';

import { GoogleProfile } from './../types/google-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountService: AccountService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>(ENV.GOOGLE_CLIENT_ID),
      clientSecret: configService.get<string>(ENV.GOOGLE_CLIENT_SECRET),
      callbackURL: configService.get<string>(ENV.GOOGLE_CALLBACK_URL),
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails } = profile;

    let user = await this.usersService.findOneByOAuthId(profile.id);

    if (!user) {
      user = await this.usersService.createWithoutPassword({
        oauthId: profile.id,
        email: emails[0].value,
        refreshToken: refreshToken,
      });

      this.accountService.createWithGoogleAuth(
        {
          username: name.givenName,
        },
        user,
      );
    } else {
      user = await this.usersService.update(user.id, {
        refreshToken,
      });
    }

    done(null, {
      ...user,
      accessToken,
      refreshToken,
    });
  }
}
