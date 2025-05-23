import { Module } from '@nestjs/common';

import { CookiesService, EmailService } from './services';

@Module({
  imports: [],
  providers: [CookiesService, EmailService],
  exports: [CookiesService, EmailService],
})
export class SharedModule {}
