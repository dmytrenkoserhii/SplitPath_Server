import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The reset token received via email',
    example: 'reset_token_123',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'The new password',
    example: 'newStrongPassword1!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
