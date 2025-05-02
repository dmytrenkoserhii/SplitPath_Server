import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { User } from '../entities';

export class UpdateUserDto implements Partial<User> {
  @IsOptional()
  @IsString()
  @IsEmail()
  @ApiPropertyOptional({ description: 'Email of the user', example: 'john.doe@example.com' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Refresh token for the user session',
    example: 'refresh_token_here',
  })
  refreshToken?: string | null;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Indicates if the user email is verified', example: false })
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Indicates if the user is premium', example: false })
  isPremium?: boolean;
}
