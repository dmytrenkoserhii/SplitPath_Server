import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { User } from '../entities';

export class UpdateUserDto implements Partial<User> {
  @ApiPropertyOptional({ description: 'Email of the user', example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Refresh token for the user session',
    example: 'refresh_token_here',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string | null;

  @ApiPropertyOptional({ description: 'Indicates if the user email is verified', example: false })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Indicates if the user is premium', example: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
