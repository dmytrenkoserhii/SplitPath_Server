import { config } from 'dotenv';
import { join } from 'path';
import * as tsconfigPaths from 'tsconfig-paths';
import { DataSource } from 'typeorm';

const ENVIRONMENT = process.env.NODE_ENV;

config({
  path: ENVIRONMENT ? `.env.${ENVIRONMENT}` : '.env.development',
});

tsconfigPaths.register({
  baseUrl: './src',
  paths: {
    '@/*': ['*'],
  },
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, 'modules', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '**', '*{.ts,.js}')],
  synchronize: false,
});
