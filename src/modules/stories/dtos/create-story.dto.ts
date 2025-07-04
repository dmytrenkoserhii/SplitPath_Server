import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { STORY_VALIDATIONS } from '../validations';

export class CreateStoryDto {
  @ApiProperty({ description: 'Title of the story', example: 'My First Story' })
  @IsString()
  @Length(STORY_VALIDATIONS.title.minLength, STORY_VALIDATIONS.title.maxLength)
  title: string;

  @ApiProperty({ description: 'Topic ID of the story', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  topicId: number;
}
