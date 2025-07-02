import { IsArray, IsNumber, IsOptional, IsString, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { STORY_SEGMENT_VALIDATIONS } from '../validations';

export class CreateStorySegmentDto {
  @ApiProperty({ description: 'Text content of the story segment' })
  @IsString()
  @Length(STORY_SEGMENT_VALIDATIONS.text.minLength, STORY_SEGMENT_VALIDATIONS.text.maxLength)
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
