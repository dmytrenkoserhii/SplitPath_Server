import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { STORY_TOPIC_VALIDATIONS } from '../validations';

export class CreateStoryTopicDto {
  @ApiProperty({ description: 'Name of the story topic' })
  @IsString()
  @Length(STORY_TOPIC_VALIDATIONS.name.minLength, STORY_TOPIC_VALIDATIONS.name.maxLength)
  name: string;

  @ApiProperty({ description: 'Description of the story topic', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(STORY_TOPIC_VALIDATIONS.description.maxLength)
  description?: string;
}
