import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './modules/database/database.module';
import { StoriesModule } from './modules/stories/stories.module';
import { UsersModule } from './modules/users/users.module';
import { ENV_VALIDATION } from './shared/constants';

const ENVIRONMENT = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENVIRONMENT ? `.env.${ENVIRONMENT}` : '.env.development',
      validationSchema: Joi.object(ENV_VALIDATION),
    }),
    DatabaseModule,
    UsersModule,
    StoriesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
