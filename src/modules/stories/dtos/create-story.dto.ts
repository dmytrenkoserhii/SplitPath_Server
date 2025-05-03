import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Length, ValidateNested } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { STORY_VALIDATIONS } from '../validations';
import { CreateStoryTopicDto } from './create-story-topic.dto';

export class CreateStoryDto {
  @ApiProperty({ description: 'Title of the story', example: 'My First Story' })
  @IsString()
  @Length(STORY_VALIDATIONS.title.minLength, STORY_VALIDATIONS.title.maxLength)
  title: string;

  @ApiProperty({ description: 'User ID of the story', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'Topic ID of the story', example: 1 })
  @ValidateNested()
  @Type(() => CreateStoryTopicDto)
  @IsNotEmpty()
  topicId: number;
}
