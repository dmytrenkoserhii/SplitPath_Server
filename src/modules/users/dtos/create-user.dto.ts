import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { USER_VALIDATIONS } from '../validations';

export class CreateUserDto {
  @ApiProperty({ description: 'Email of the user', example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'The password of the user',
  })
  @IsString()
  @Length(USER_VALIDATIONS.password.minLength, USER_VALIDATIONS.password.maxLength)
  @Matches(USER_VALIDATIONS.password.matches)
  password: string;

  @ApiProperty({
    description: 'The username of the user',
    example: 'john_doe',
  })
  @IsString()
  @Length(USER_VALIDATIONS.username.minLength, USER_VALIDATIONS.username.maxLength)
  username: string;
}
