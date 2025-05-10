import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { FriendStatus } from '../enums';

export enum RequestDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export class GetFriendRequestsDto {
  @ApiProperty({ enum: FriendStatus, required: false })
  @IsEnum(FriendStatus)
  @IsOptional()
  status?: FriendStatus;

  @ApiProperty({ enum: RequestDirection, required: false })
  @IsEnum(RequestDirection)
  @IsOptional()
  direction?: RequestDirection;

  @ApiProperty({ required: false, default: 1 })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}
