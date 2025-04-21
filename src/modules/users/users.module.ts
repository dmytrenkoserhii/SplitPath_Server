import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './controllers';
import { Account, User } from './entities';
import { AccountService, UsersService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account])],
  controllers: [UsersController],
  providers: [UsersService, AccountService],
  exports: [UsersService],
})
export class UsersModule {}
