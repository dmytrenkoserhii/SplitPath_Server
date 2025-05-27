import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FriendsModule } from '@/modules/friends/friends.module';
import { UsersModule } from '@/modules/users/users.module';

import { PrivateMessagesController } from './controllers';
import { Message } from './entities';
import { PrivateChatsGateway } from './gateways';
import { PrivateMessagesService } from './services';

@Module({
  imports: [UsersModule, FriendsModule, TypeOrmModule.forFeature([Message])],
  controllers: [PrivateMessagesController],
  providers: [PrivateMessagesService, PrivateChatsGateway],
})
export class MessagesModule {}
