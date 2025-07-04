import { IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateStorySegmentDto {
  @ApiProperty({ description: 'Selected choice for this segment', required: false })
  @IsOptional()
  @IsString()
  selectedChoice?: string;
}
