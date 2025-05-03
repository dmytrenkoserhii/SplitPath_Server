import { IsString, Length } from 'class-validator';
import { IsOptional } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { Account } from '../entities';
import { USER_VALIDATIONS } from '../validations';

export class UpdateAccountDto implements Partial<Account> {
  @ApiPropertyOptional({
    description: 'Username of the account',
    example: 'johndoe123',
  })
  @IsOptional()
  @IsString()
  @Length(USER_VALIDATIONS.username.minLength, USER_VALIDATIONS.username.maxLength)
  username?: string;
}
