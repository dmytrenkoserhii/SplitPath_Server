import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Email of the user', example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'The password of the user',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The username of the user',
    example: 'john_doe',
  })
  @IsNotEmpty()
  @IsString()
  username: string;
}
