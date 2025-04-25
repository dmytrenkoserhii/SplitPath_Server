import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateStorySegmentDto {
  @ApiProperty({ description: 'Text content of the story segment' })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({ description: 'Available choices for this segment', type: [String] })
  @IsArray()
  @IsString({ each: true })
  choices: string[];

  @ApiProperty({ description: 'ID of the story this segment belongs to' })
  @IsNumber()
  storyId: number;

  @ApiProperty({ description: 'Selected choice for this segment', required: false })
  @IsOptional()
  @IsString()
  selectedChoice?: string;
}
