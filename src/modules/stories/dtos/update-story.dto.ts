import { IsEnum, IsOptional, IsString } from 'class-validator';

import { StoryStatus } from '../enums/story-status.enum';

export class UpdateStoryDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(StoryStatus)
  @IsOptional()
  status?: StoryStatus;
}
