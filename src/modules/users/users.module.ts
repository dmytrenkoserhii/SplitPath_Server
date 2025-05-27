import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '@/shared/shared.module';

import { UsersController } from './controllers';
import { Account, User } from './entities';
import { AccountService, UsersService, VerificationService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account]), SharedModule],
  controllers: [UsersController],
  providers: [UsersService, AccountService, VerificationService],
  exports: [UsersService, AccountService, VerificationService],
})
export class UsersModule {}
