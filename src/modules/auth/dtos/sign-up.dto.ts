import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { AUTH_VALIDATIONS } from '../validations';

export class SignUpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'The password of the user',
    minLength: AUTH_VALIDATIONS.password.minLength,
    maxLength: AUTH_VALIDATIONS.password.maxLength,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(AUTH_VALIDATIONS.password.minLength)
  @MaxLength(AUTH_VALIDATIONS.password.maxLength)
  @Matches(AUTH_VALIDATIONS.password.matches, {
    message: 'password too weak',
  })
  password: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'The username of the user',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(AUTH_VALIDATIONS.username.minLength)
  @MaxLength(AUTH_VALIDATIONS.username.maxLength)
  username: string;
}
