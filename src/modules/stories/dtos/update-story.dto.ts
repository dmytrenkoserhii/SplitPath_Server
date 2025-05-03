import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { StoryStatus } from '../enums/story-status.enum';
import { STORY_VALIDATIONS } from '../validations';

export class UpdateStoryDto {
  @ApiPropertyOptional({ description: 'Title of the story', example: 'My First Story' })
  @IsString()
  @IsOptional()
  @Length(STORY_VALIDATIONS.title.minLength, STORY_VALIDATIONS.title.maxLength)
  title?: string;

  @ApiPropertyOptional({ description: 'Status of the story', example: StoryStatus.NEW })
  @IsEnum(StoryStatus)
  @IsOptional()
  status?: StoryStatus;
}
