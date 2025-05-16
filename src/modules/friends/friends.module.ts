import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '@/modules/users/users.module';

import { FriendsController } from './controllers';
import { Friend } from './entities';
import { FriendsGateway } from './gateways';
import { FriendsService } from './services';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Friend])],
  controllers: [FriendsController],
  providers: [FriendsService, FriendsGateway],
  exports: [FriendsService],
})
export class FriendsModule {}
