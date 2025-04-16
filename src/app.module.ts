import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ENV_VALIDATION } from './shared/constants';

const ENVIRONMENT = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENVIRONMENT ? `.env.${ENVIRONMENT}` : '.env.development',
      validationSchema: Joi.object(ENV_VALIDATION),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
