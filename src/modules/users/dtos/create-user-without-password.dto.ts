import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { User } from '../entities';

export class CreateUserWithoutPasswordDto implements Partial<User> {
  @ApiProperty({ description: 'Email of the user', example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'OAuth ID for the user', example: 'oauthId123' })
  @IsOptional()
  @IsString()
  oauthId?: string;

  @ApiPropertyOptional({
    description: 'Refresh token for the user session',
    example: 'refresh_token_here',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
