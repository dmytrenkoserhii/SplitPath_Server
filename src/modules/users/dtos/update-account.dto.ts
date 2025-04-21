import { IsString } from 'class-validator';
import { IsOptional } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { Account } from '../entities';

export class UpdateAccountDto implements Partial<Account> {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Username of the account',
    example: 'johndoe123',
  })
  username?: string;
}
