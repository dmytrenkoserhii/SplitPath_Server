import { IsString, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { Account } from '../entities';
import { USER_VALIDATIONS } from '../validations';

export class CreateAccountDto implements Partial<Account> {
  @ApiProperty({
    description: 'Username of the account',
    example: 'johndoe123',
  })
  @IsString()
  @Length(USER_VALIDATIONS.username.minLength, USER_VALIDATIONS.username.maxLength)
  username: string;
}
