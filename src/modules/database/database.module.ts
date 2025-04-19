import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ENV } from '@/shared/enums';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>(ENV.DATABASE_URL),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [join(__dirname, '..', '..', 'migrations', '**', '*{.ts,.js}')],
      }),
    }),
  ],
})
export class DatabaseModule {}
