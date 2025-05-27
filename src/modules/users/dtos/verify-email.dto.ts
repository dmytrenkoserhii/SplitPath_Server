import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'jwt.token.here',
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}
