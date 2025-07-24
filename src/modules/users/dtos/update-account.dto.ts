import { IsDateString, IsOptional, IsString, Length, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @Length(USER_VALIDATIONS.firstName.minLength, USER_VALIDATIONS.firstName.maxLength)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @Length(USER_VALIDATIONS.lastName.minLength, USER_VALIDATIONS.lastName.maxLength)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Birth date of the user',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @ApiPropertyOptional({
    description: 'Bio/description of the user',
    example: 'I love reading adventure stories and sharing them with friends.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(USER_VALIDATIONS.bio.maxLength)
  bio?: string;
}
