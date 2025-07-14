import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '@/modules/users/users.module';

import { GlobalChatController } from './controllers';
import { GlobalChatMessage } from './entities';
import { GlobalChatGateway } from './gateways';
import { GlobalChatService } from './services';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([GlobalChatMessage])],
  controllers: [GlobalChatController],
  providers: [GlobalChatService, GlobalChatGateway],
})
export class GlobalChatModule {}
