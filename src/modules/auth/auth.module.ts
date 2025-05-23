import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '@/modules/users/users.module';
import { SharedModule } from '@/shared/shared.module';

import { AuthController } from './controllers';
import { AuthService, TokensService } from './services';
import {
  AccessTokenStrategy,
  GoogleStrategy,
  LocalStrategy,
  RefreshTokenStrategy,
} from './strategies';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
    }),
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    LocalStrategy,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, TokensService],
})
export class AuthModule {}
