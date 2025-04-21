import { IsString } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { Account } from '../entities';

export class CreateAccountDto implements Partial<Account> {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Username of the account',
    example: 'johndoe123',
  })
  username: string;
}
