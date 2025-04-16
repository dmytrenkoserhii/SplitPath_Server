import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ENV_VALIDATION } from './shared/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
      validationSchema: Joi.object(ENV_VALIDATION),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
