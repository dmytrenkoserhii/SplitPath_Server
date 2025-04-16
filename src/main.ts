import cookieParser from 'cookie-parser';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ENV } from '@/shared/enums';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: configService.get(ENV.CORS_ORIGIN, true),
    methods: configService.get(ENV.CORS_METHODS, 'GET,HEAD,POST,PUT,PATCH,DELETE'),
    allowedHeaders: configService.get(ENV.CORS_HEADERS, 'Content-Type,Accept,Authorization'),
    credentials: configService.get(ENV.CORS_CREDENTIALS, true),
  });

  const config = new DocumentBuilder()
    .setTitle('SplitPath API')
    .setDescription('The SplitPath server API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get(ENV.PORT, 5050);
  await app.listen(port);
}
bootstrap();
